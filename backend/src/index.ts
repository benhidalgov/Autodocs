import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateRut, formatRut } from '../../shared/rut';
import { RolUsuario, Estado, Prioridad } from '../../shared/types';
import {
  autenticarToken,
  autorizarRoles,
  AuthRequest,
  JWT_SECRET,
  UsuarioTokenPayload
} from './middlewares/auth';
import { CATALOGO_CMDB, calcularBlastRadius, sugerirCausaRaizTicket } from './cmdbData';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper para parsear parametros ID de express
function parseParamId(param: string | string[] | undefined): number {
  const val = Array.isArray(param) ? param[0] : param;
  return parseInt(val || '', 10);
}

// Helper para generar el proximo codigo correlativo inmutable: TCK-YYYY-XXXX
async function generarCodigoTicket(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `TCK-${currentYear}-`;

  const ultimoTicket = await prisma.ticket.findFirst({
    where: {
      codigo: {
        startsWith: prefix
      }
    },
    orderBy: {
      id: 'desc'
    }
  });

  let nextSeq = 1;
  if (ultimoTicket) {
    const parts = ultimoTicket.codigo.split('-');
    if (parts.length === 3) {
      const parsedSeq = parseInt(parts[2], 10);
      if (!isNaN(parsedSeq)) {
        nextSeq = parsedSeq + 1;
      }
    }
  }

  const paddedSeq = nextSeq.toString().padStart(4, '0');
  return `${prefix}${paddedSeq}`;
}

// ==========================================
// 1. AUTENTICACION: POST /api/auth/login
// ==========================================
const loginSchema = z.object({
  identificador: z.string().min(1, 'El identificador (RUT o Email) es obligatorio'),
  password: z.string().min(1, 'La contrasena es obligatoria')
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const validacion = loginSchema.safeParse(req.body);
    if (!validacion.success) {
      return res.status(400).json({
        error: '[ERROR] Datos de ingreso invalidos',
        detalles: validacion.error.flatten().fieldErrors
      });
    }

    const { identificador, password } = validacion.data;
    const cleanIdent = identificador.trim();

    // Intentar buscar por RUT o por Email
    let usuario = null;
    if (cleanIdent.includes('@')) {
      usuario = await prisma.usuario.findUnique({
        where: { email: cleanIdent.toLowerCase() }
      });
    } else {
      const rutFormateado = formatRut(cleanIdent);
      usuario = await prisma.usuario.findUnique({
        where: { rut: rutFormateado }
      });
    }

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        error: '[ERROR] Credenciales invalidas o cuenta inactiva'
      });
    }

    // Validar contrasena con bcrypt
    const passwordCorrecto = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordCorrecto) {
      return res.status(401).json({
        error: '[ERROR] Credenciales invalidas o cuenta inactiva'
      });
    }

    const tokenPayload: UsuarioTokenPayload = {
      id: usuario.id,
      rut: usuario.rut,
      nombre: usuario.nombre,
      email: usuario.email,
      departamento: usuario.departamento,
      rol: usuario.rol as RolUsuario
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

    return res.json({
      token,
      usuario: tokenPayload
    });
  } catch (error) {
    console.error('[ERROR] Error en login:', error);
    return res.status(500).json({ error: '[ERROR] Error interno en el proceso de autenticacion' });
  }
});

// ==========================================
// 2. PERFIL: GET /api/auth/perfil
// ==========================================
app.get('/api/auth/perfil', autenticarToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({ error: '[ERROR] No autenticado' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: {
        id: true,
        rut: true,
        nombre: true,
        departamento: true,
        email: true,
        rol: true,
        activo: true,
        creadoEn: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: '[ERROR] Usuario no encontrado' });
    }

    return res.json(usuario);
  } catch (error) {
    console.error('[ERROR] Error al consultar perfil:', error);
    return res.status(500).json({ error: '[ERROR] Error al consultar perfil' });
  }
});

// ==========================================
// 3. CONSULTA DE RUT: GET /api/usuarios/:rut
// ==========================================
app.get('/api/usuarios/:rut', async (req: Request, res: Response) => {
  try {
    const rawRut = Array.isArray(req.params.rut) ? req.params.rut[0] : req.params.rut;
    if (!rawRut) {
      return res.status(400).json({ error: '[ERROR] RUT es requerido' });
    }

    const rut = formatRut(rawRut);
    if (!validateRut(rut)) {
      return res.status(400).json({ error: '[ERROR] El RUT no cumple con el algoritmo Modulo 11' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { rut },
      select: {
        id: true,
        rut: true,
        nombre: true,
        departamento: true,
        email: true,
        rol: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: '[ERROR] Colaborador no encontrado con el RUT ingresado' });
    }

    return res.json(usuario);
  } catch (error) {
    console.error('[ERROR] Error al buscar usuario:', error);
    return res.status(500).json({ error: '[ERROR] Error al consultar usuario' });
  }
});

// ==========================================
// 4. MIS TICKETS: GET /api/mis-tickets
// ==========================================
app.get('/api/mis-tickets', autenticarToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({ error: '[ERROR] No autenticado' });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        solicitanteId: req.usuario.id
      },
      orderBy: {
        creadoEn: 'desc'
      },
      include: {
        solicitante: {
          select: { id: true, rut: true, nombre: true, departamento: true, email: true, rol: true }
        },
        tecnico: {
          select: { id: true, rut: true, nombre: true, departamento: true, email: true, rol: true }
        },
        comentarios: {
          where: { esInterno: false }, // Solicitante solo ve comentarios publicos
          orderBy: { creadoEn: 'asc' },
          include: {
            autor: {
              select: { id: true, nombre: true, rol: true }
            }
          }
        }
      }
    });

    return res.json(tickets);
  } catch (error) {
    console.error('[ERROR] Error al listar mis tickets:', error);
    return res.status(500).json({ error: '[ERROR] Error al recuperar tickets personales' });
  }
});

// ==========================================
// 5. CREAR TICKET: POST /api/tickets
// ==========================================
const crearTicketSchema = z.object({
  rut: z.string().optional(),
  categoria: z.string().min(1, 'La categoria es obligatoria'),
  prioridad: z.enum(['baja', 'media', 'alta', 'critica'], {
    errorMap: () => ({ message: 'Prioridad invalida (baja, media, alta, critica)' })
  }),
  descripcion: z.string().min(5, 'La descripcion debe tener al menos 5 caracteres'),
  ciAfectado: z.string().optional()
});

app.post('/api/tickets', async (req: AuthRequest, res: Response) => {
  try {
    const validacion = crearTicketSchema.safeParse(req.body);
    if (!validacion.success) {
      return res.status(400).json({
        error: '[ERROR] Datos invalidos',
        detalles: validacion.error.flatten().fieldErrors
      });
    }

    const { rut: rawRut, categoria, prioridad, descripcion, ciAfectado } = validacion.data;

    let solicitanteId: number | null = null;

    // Si viene token autenticado, usar el usuario de la sesion
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = jwt.verify(token, JWT_SECRET) as UsuarioTokenPayload;
        solicitanteId = payload.id;
      } catch (e) {
        // Token no valido, continuar validando por RUT
      }
    }

    if (!solicitanteId) {
      if (!rawRut) {
        return res.status(400).json({ error: '[ERROR] Se requiere RUT o sesion activa para crear el ticket' });
      }

      const rut = formatRut(rawRut);
      if (!validateRut(rut)) {
        return res.status(400).json({ error: '[ERROR] RUT no valido segun Modulo 11' });
      }

      const usuario = await prisma.usuario.findUnique({ where: { rut } });
      if (!usuario) {
        return res.status(404).json({ error: '[ERROR] El usuario no esta registrado en el sistema' });
      }
      solicitanteId = usuario.id;
    }

    const codigo = await generarCodigoTicket();

    // Asignar SLA segun prioridad (minutos)
    let slaLimiteMinutos = 240; // 4 horas
    if (prioridad === 'critica') slaLimiteMinutos = 60; // 1 hora
    else if (prioridad === 'alta') slaLimiteMinutos = 120; // 2 horas
    else if (prioridad === 'baja') slaLimiteMinutos = 480; // 8 horas

    const nuevoTicket = await prisma.ticket.create({
      data: {
        codigo,
        solicitanteId,
        categoria,
        prioridad,
        estado: 'abierto',
        descripcion,
        ciAfectado: ciAfectado || null,
        slaLimiteMinutos
      },
      include: {
        solicitante: {
          select: { id: true, rut: true, nombre: true, departamento: true, email: true, rol: true }
        },
        tecnico: {
          select: { id: true, rut: true, nombre: true, departamento: true, email: true, rol: true }
        },
        comentarios: true
      }
    });

    return res.status(201).json(nuevoTicket);
  } catch (error) {
    console.error('[ERROR] Error al crear ticket:', error);
    return res.status(500).json({ error: '[ERROR] Error interno al crear ticket' });
  }
});

// ==========================================
// 6. LISTADO GENERAL: GET /api/tickets
// ==========================================
app.get('/api/tickets', async (req: Request, res: Response) => {
  try {
    const { estado, departamento, categoria, prioridad, busqueda } = req.query;

    const whereClause: any = {};

    if (estado && estado !== 'todos') {
      whereClause.estado = String(estado);
    }
    if (categoria && categoria !== 'todos') {
      whereClause.categoria = String(categoria);
    }
    if (prioridad && prioridad !== 'todos') {
      whereClause.prioridad = String(prioridad);
    }
    if (departamento && departamento !== 'todos') {
      whereClause.solicitante = {
        departamento: String(departamento)
      };
    }

    if (busqueda && String(busqueda).trim() !== '') {
      const q = String(busqueda).trim();
      whereClause.OR = [
        { codigo: { contains: q } },
        { descripcion: { contains: q } },
        { categoria: { contains: q } },
        { solicitante: { nombre: { contains: q } } },
        { solicitante: { rut: { contains: q } } }
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      orderBy: { creadoEn: 'desc' },
      include: {
        solicitante: {
          select: { id: true, rut: true, nombre: true, departamento: true, email: true, rol: true }
        },
        tecnico: {
          select: { id: true, rut: true, nombre: true, departamento: true, email: true, rol: true }
        },
        comentarios: {
          orderBy: { creadoEn: 'asc' },
          include: {
            autor: {
              select: { id: true, nombre: true, rol: true }
            }
          }
        }
      }
    });

    return res.json(tickets);
  } catch (error) {
    console.error('[ERROR] Error al listar tickets:', error);
    return res.status(500).json({ error: '[ERROR] Error al recuperar tickets' });
  }
});

// ==========================================
// 7. DETALLE DE TICKET: GET /api/tickets/:id
// ==========================================
app.get('/api/tickets/:id', async (req: Request, res: Response) => {
  try {
    const id = parseParamId(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '[ERROR] ID de ticket no valido' });
    }

    // Detectar rol del usuario autenticado si envia token
    let esStaff = false;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(authHeader.substring(7), JWT_SECRET) as UsuarioTokenPayload;
        if (payload.rol === 'AGENTE_SOPORTE' || payload.rol === 'SUPERVISOR_ADMIN') {
          esStaff = true;
        }
      } catch (e) {
        // Token no valido
      }
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        solicitante: {
          select: { id: true, rut: true, nombre: true, departamento: true, email: true, rol: true }
        },
        tecnico: {
          select: { id: true, rut: true, nombre: true, departamento: true, email: true, rol: true }
        },
        comentarios: {
          where: esStaff ? {} : { esInterno: false },
          orderBy: { creadoEn: 'asc' },
          include: {
            autor: {
              select: { id: true, nombre: true, rol: true }
            }
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: '[ERROR] Ticket no encontrado' });
    }

    return res.json(ticket);
  } catch (error) {
    console.error('[ERROR] Error al obtener detalle de ticket:', error);
    return res.status(500).json({ error: '[ERROR] Error al consultar ticket' });
  }
});

// ==========================================
// 8. AGREGAR COMENTARIO: POST /api/tickets/:id/comentarios
// ==========================================
const crearComentarioSchema = z.object({
  contenido: z.string().min(1, 'El contenido del comentario es obligatorio'),
  esInterno: z.boolean().optional().default(false)
});

app.post('/api/tickets/:id/comentarios', autenticarToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.usuario) {
      return res.status(401).json({ error: '[ERROR] No autenticado' });
    }

    const id = parseParamId(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: '[ERROR] ID de ticket no valido' });
    }

    const validacion = crearComentarioSchema.safeParse(req.body);
    if (!validacion.success) {
      return res.status(400).json({
        error: '[ERROR] Datos invalidos',
        detalles: validacion.error.flatten().fieldErrors
      });
    }

    const { contenido, esInterno } = validacion.data;

    // Solo personal de soporte o administrador puede publicar notas internas
    if (esInterno && req.usuario.rol === 'SOLICITANTE') {
      return res.status(403).json({ error: '[DENEGADO] Solo personal de soporte puede agregar notas internas' });
    }

    const ticketExistente = await prisma.ticket.findUnique({ where: { id } });
    if (!ticketExistente) {
      return res.status(404).json({ error: '[ERROR] Ticket no encontrado' });
    }

    const comentario = await prisma.comentario.create({
      data: {
        ticketId: id,
        autorId: req.usuario.id,
        contenido,
        esInterno
      },
      include: {
        autor: {
          select: { id: true, nombre: true, rol: true }
        }
      }
    });

    return res.status(201).json(comentario);
  } catch (error) {
    console.error('[ERROR] Error al crear comentario:', error);
    return res.status(500).json({ error: '[ERROR] Error interno al publicar comentario' });
  }
});

// ==========================================
// 9. ACTUALIZAR ESTADO: PATCH /api/tickets/:id/estado
// ==========================================
const actualizarEstadoSchema = z.object({
  estado: z.enum(['abierto', 'en_proceso', 'pendiente_usuario', 'resuelto', 'cerrado'], {
    errorMap: () => ({ message: 'Estado invalido (abierto, en_proceso, pendiente_usuario, resuelto, cerrado)' })
  }),
  ciAfectado: z.string().optional()
});

app.patch(
  '/api/tickets/:id/estado',
  autenticarToken,
  autorizarRoles('AGENTE_SOPORTE', 'SUPERVISOR_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = parseParamId(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: '[ERROR] ID de ticket no valido' });
      }

      const validacion = actualizarEstadoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          error: '[ERROR] Datos invalidos',
          detalles: validacion.error.flatten().fieldErrors
        });
      }

      const { estado, ciAfectado } = validacion.data;

      const ticketPrevio = await prisma.ticket.findUnique({ where: { id } });
      if (!ticketPrevio) {
        return res.status(404).json({ error: '[ERROR] Ticket no encontrado' });
      }

      const dataUpdate: any = {
        estado
      };

      if (ciAfectado !== undefined) {
        dataUpdate.ciAfectado = ciAfectado;
      }

      if (estado === 'resuelto' || estado === 'cerrado') {
        dataUpdate.resueltoEn = new Date();
      }

      const ticketActualizado = await prisma.ticket.update({
        where: { id },
        data: dataUpdate,
        include: {
          solicitante: {
            select: { id: true, rut: true, nombre: true, departamento: true, email: true, rol: true }
          },
          tecnico: {
            select: { id: true, rut: true, nombre: true, departamento: true, email: true, rol: true }
          },
          comentarios: true
        }
      });

      // Registro de trazabilidad y auditoria inmutable
      const cambios: string[] = [];
      if (ticketPrevio.estado !== estado) {
        cambios.push(`Estado transicionado de '${ticketPrevio.estado.replace('_', ' ')}' a '${estado.replace('_', ' ')}'`);
      }
      if (ciAfectado !== undefined && ciAfectado !== ticketPrevio.ciAfectado) {
        cambios.push(`CI CMDB vinculado: [${ciAfectado || 'Sin CI'}]`);
      }

      if (cambios.length > 0 && req.usuario) {
        await prisma.comentario.create({
          data: {
            ticketId: id,
            autorId: req.usuario.id,
            contenido: `[AUDITORIA-ESTADO] ${req.usuario.nombre} (${req.usuario.rol}): ${cambios.join(' | ')}.`,
            esInterno: false
          }
        });
      }

      return res.json(ticketActualizado);
    } catch (error) {
      console.error('[ERROR] Error al actualizar estado:', error);
      return res.status(500).json({ error: '[ERROR] Error al actualizar estado del ticket' });
    }
  }
);

// ==========================================
// 10. ASIGNAR TECNICO: PATCH /api/tickets/:id/asignar
// ==========================================
const asignarTecnicoSchema = z.object({
  tecnicoId: z.number().nullable()
});

app.patch(
  '/api/tickets/:id/asignar',
  autenticarToken,
  autorizarRoles('AGENTE_SOPORTE', 'SUPERVISOR_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = parseParamId(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: '[ERROR] ID de ticket no valido' });
      }

      const validacion = asignarTecnicoSchema.safeParse(req.body);
      if (!validacion.success) {
        return res.status(400).json({
          error: '[ERROR] Datos invalidos',
          detalles: validacion.error.flatten().fieldErrors
        });
      }

      const { tecnicoId } = validacion.data;

      const ticketPrevio = await prisma.ticket.findUnique({
        where: { id },
        include: { tecnico: true }
      });

      if (!ticketPrevio) {
        return res.status(404).json({ error: '[ERROR] Ticket no encontrado' });
      }

      let tecnico = null;
      if (tecnicoId) {
        tecnico = await prisma.usuario.findUnique({ where: { id: tecnicoId } });
        if (!tecnico || (tecnico.rol !== 'AGENTE_SOPORTE' && tecnico.rol !== 'SUPERVISOR_ADMIN')) {
          return res.status(400).json({ error: '[ERROR] El usuario asignado debe tener rol de soporte o administrador' });
        }
      }

      const ticketActualizado = await prisma.ticket.update({
        where: { id },
        data: {
          tecnicoId,
          estado: tecnicoId && ticketPrevio.estado === 'abierto' ? 'en_proceso' : ticketPrevio.estado
        },
        include: {
          solicitante: true,
          tecnico: true,
          comentarios: true
        }
      });

      // Registro de auditoria por cambio de asignacion
      if (req.usuario && ticketPrevio.tecnicoId !== tecnicoId) {
        const detalleAsignacion = tecnicoId
          ? `Asigno como responsable a ${tecnico?.nombre} (${tecnico?.rol})`
          : `Removio asignacion de tecnico (Ticket en cola)`;

        await prisma.comentario.create({
          data: {
            ticketId: id,
            autorId: req.usuario.id,
            contenido: `[AUDITORIA-ASIGNACION] ${req.usuario.nombre} (${req.usuario.rol}): ${detalleAsignacion}.`,
            esInterno: false
          }
        });
      }

      return res.json(ticketActualizado);
    } catch (error) {
      console.error('[ERROR] Error al asignar tecnico:', error);
      return res.status(500).json({ error: '[ERROR] Error al asignar tecnico responsable' });
    }
  }
);

// ==========================================
// 11. LISTAR TECNICOS: GET /api/soporte/tecnicos
// ==========================================
app.get(
  '/api/soporte/tecnicos',
  autenticarToken,
  autorizarRoles('AGENTE_SOPORTE', 'SUPERVISOR_ADMIN'),
  async (_req: Request, res: Response) => {
    try {
      const tecnicos = await prisma.usuario.findMany({
        where: {
          rol: { in: ['AGENTE_SOPORTE', 'SUPERVISOR_ADMIN'] },
          activo: true
        },
        select: {
          id: true,
          rut: true,
          nombre: true,
          departamento: true,
          email: true,
          rol: true
        },
        orderBy: { nombre: 'asc' }
      });

      return res.json(tecnicos);
    } catch (error) {
      console.error('[ERROR] Error al listar tecnicos:', error);
      return res.status(500).json({ error: '[ERROR] Error al consultar personal de soporte' });
    }
  }
);

// ==========================================
// 12. METRICAS SLA: GET /api/admin/metricas-sla
// ==========================================
app.get(
  '/api/admin/metricas-sla',
  autenticarToken,
  autorizarRoles('AGENTE_SOPORTE', 'SUPERVISOR_ADMIN'),
  async (_req: Request, res: Response) => {
    try {
      const todosLosTickets = await prisma.ticket.findMany({
        include: { solicitante: true }
      });

      const totalTickets = todosLosTickets.length;
      let abiertos = 0;
      let enProceso = 0;
      let resueltos = 0;
      let cerrados = 0;
      let criticosActivos = 0;
      let sumaMinutosResolucion = 0;
      let ticketsConResolucion = 0;
      let ticketsCumplenSla = 0;

      const catMap: Record<string, number> = {};
      const deptoMap: Record<string, number> = {};

      const now = new Date().getTime();

      for (const t of todosLosTickets) {
        if (t.estado === 'abierto') abiertos++;
        else if (t.estado === 'en_proceso' || t.estado === 'pendiente_usuario') enProceso++;
        else if (t.estado === 'resuelto') resueltos++;
        else if (t.estado === 'cerrado') cerrados++;

        if (t.prioridad === 'critica' && (t.estado === 'abierto' || t.estado === 'en_proceso')) {
          criticosActivos++;
        }

        // Categorias
        catMap[t.categoria] = (catMap[t.categoria] || 0) + 1;

        // Departamentos
        if (t.solicitante?.departamento) {
          deptoMap[t.solicitante.departamento] = (deptoMap[t.solicitante.departamento] || 0) + 1;
        }

        // Calculo de SLA y MTTR
        const inicio = new Date(t.creadoEn).getTime();
        const fin = t.resueltoEn ? new Date(t.resueltoEn).getTime() : now;
        const duracionMinutos = Math.round((fin - inicio) / (1000 * 60));

        if (t.resueltoEn) {
          sumaMinutosResolucion += duracionMinutos;
          ticketsConResolucion++;
        }

        if (duracionMinutos <= t.slaLimiteMinutos) {
          ticketsCumplenSla++;
        }
      }

      const mttrPromedioMinutos =
        ticketsConResolucion > 0 ? Math.round(sumaMinutosResolucion / ticketsConResolucion) : 0;
      const cumplimientoSlaPorcentaje =
        totalTickets > 0 ? Math.round((ticketsCumplenSla / totalTickets) * 100) : 100;

      const distribucionCategorias = Object.entries(catMap).map(([categoria, cantidad]) => ({
        categoria,
        cantidad
      }));

      const distribucionDepartamentos = Object.entries(deptoMap).map(([departamento, cantidad]) => ({
        departamento,
        cantidad
      }));

      return res.json({
        totalTickets,
        abiertos,
        enProceso,
        resueltos,
        cerrados,
        criticosActivos,
        mttrPromedioMinutos,
        cumplimientoSlaPorcentaje,
        distribucionCategorias,
        distribucionDepartamentos
      });
    } catch (error) {
      console.error('[ERROR] Error al calcular metricas SLA:', error);
      return res.status(500).json({ error: '[ERROR] Error al calcular metricas analiticas' });
    }
  }
);

// ==========================================
// 13. CATALOGO CMDB: GET /api/cmdb/cis
// ==========================================
app.get('/api/cmdb/cis', (req: Request, res: Response) => {
  try {
    const { capa, criticidad, busqueda } = req.query;

    let resultado = [...CATALOGO_CMDB];

    if (capa && typeof capa === 'string' && capa !== 'todas') {
      resultado = resultado.filter((c) => c.capa === capa);
    }

    if (criticidad && typeof criticidad === 'string' && criticidad !== 'todas') {
      resultado = resultado.filter((c) => c.criticidad === criticidad);
    }

    if (busqueda && typeof busqueda === 'string' && busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      resultado = resultado.filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.nombre.toLowerCase().includes(q) ||
          c.descripcion.toLowerCase().includes(q) ||
          (c.palabrasClave && c.palabrasClave.some((k) => k.toLowerCase().includes(q)))
      );
    }

    return res.json(resultado);
  } catch (error) {
    console.error('[ERROR] Error al listar CIs de la CMDB:', error);
    return res.status(500).json({ error: '[ERROR] Error al consultar catalogo CMDB' });
  }
});

// ==========================================
// 14. DETALLE DE CI & BLAST RADIUS: GET /api/cmdb/cis/:id
// ==========================================
app.get('/api/cmdb/cis/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const ci = CATALOGO_CMDB.find((c) => c.id.toLowerCase() === id.toLowerCase());

    if (!ci) {
      return res.status(404).json({ error: `[ERROR] Componente de infraestructura '${id}' no encontrado en la CMDB` });
    }

    const blastRadius = calcularBlastRadius(ci.id);
    return res.json({
      ...ci,
      blastRadius
    });
  } catch (error) {
    console.error('[ERROR] Error al consultar CI:', error);
    return res.status(500).json({ error: '[ERROR] Error al recuperar detalle del CI' });
  }
});

// ==========================================
// 15. DIAGNOSTICO RCA INTELIGENTE: GET /api/tickets/:id/diagnostico-rca
// ==========================================
app.get(
  '/api/tickets/:id/diagnostico-rca',
  autenticarToken,
  autorizarRoles('AGENTE_SOPORTE', 'SUPERVISOR_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = parseParamId(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: '[ERROR] ID de ticket no valido' });
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: {
          solicitante: true
        }
      });

      if (!ticket) {
        return res.status(404).json({ error: '[ERROR] Ticket no encontrado' });
      }

      const diagnostico = sugerirCausaRaizTicket({
        id: ticket.id,
        categoria: ticket.categoria,
        descripcion: ticket.descripcion,
        ciAfectado: ticket.ciAfectado
      });

      return res.json(diagnostico);
    } catch (error) {
      console.error('[ERROR] Error al calcular diagnostico RCA:', error);
      return res.status(500).json({ error: '[ERROR] Error al ejecutar motor de diagnostico' });
    }
  }
);

// ==========================================
// 16. CORRELACION DE INCIDENTES MASIVOS: GET /api/operaciones/correlacion-masiva
// ==========================================
app.get(
  '/api/operaciones/correlacion-masiva',
  autenticarToken,
  autorizarRoles('AGENTE_SOPORTE', 'SUPERVISOR_ADMIN'),
  async (_req: AuthRequest, res: Response) => {
    try {
      // Buscar tickets abiertos o en proceso con CI asignado
      const ticketsActivos = await prisma.ticket.findMany({
        where: {
          estado: { in: ['abierto', 'en_proceso'] }
        }
      });

      const mapaCI: Record<string, { ticketsIds: number[]; codigos: string[] }> = {};

      for (const t of ticketsActivos) {
        // Si no tiene CI, inferirlo al vuelo
        let targetCI = t.ciAfectado;
        if (!targetCI) {
          const sug = sugerirCausaRaizTicket({
            id: t.id,
            categoria: t.categoria,
            descripcion: t.descripcion,
            ciAfectado: t.ciAfectado
          });
          targetCI = sug.ciSugerido.id;
        }

        if (!mapaCI[targetCI]) {
          mapaCI[targetCI] = { ticketsIds: [], codigos: [] };
        }
        mapaCI[targetCI].ticketsIds.push(t.id);
        mapaCI[targetCI].codigos.push(t.codigo);
      }

      const correlaciones = Object.entries(mapaCI).map(([ciId, datos]) => {
        const ciInfo = CATALOGO_CMDB.find((c) => c.id === ciId) || {
          id: ciId,
          nombre: ciId,
          capa: 'L3_MIDDLEWARE' as const,
          criticidad: 'ALTA' as const,
          ip: '10.24.0.0',
          ambiente: 'PRODUCCION' as const,
          descripcion: 'Componente identificado dinamicamente'
        };

        const total = datos.ticketsIds.length;
        const alertaMasiva = total >= 2;

        return {
          ciId,
          ciNombre: ciInfo.nombre,
          capa: ciInfo.capa,
          totalTicketsAsociados: total,
          ticketsIds: datos.ticketsIds,
          codigosTickets: datos.codigos,
          alertaMasiva,
          descripcionImpacto: alertaMasiva
            ? `[ALERTA INCIDENTE MAYOR] ${total} tickets activos correlacionados apuntan a falla en ${ciInfo.nombre}.`
            : `Monitoreo normal: ${total} ticket asociado.`
        };
      });

      // Ordenar por mayor cantidad de tickets asociados
      correlaciones.sort((a, b) => b.totalTicketsAsociados - a.totalTicketsAsociados);

      return res.json(correlaciones);
    } catch (error) {
      console.error('[ERROR] Error al correlacionar incidentes:', error);
      return res.status(500).json({ error: '[ERROR] Error al calcular correlacion masiva' });
    }
  }
);

// ==========================================
// 17. HEALTH CHECK
// ==========================================
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: '[OK]',
    service: 'Sistema de Tickets de Soporte y Autoservicio',
    timestamp: new Date().toISOString()
  });
});

const PORT_NUM = Number(process.env.PORT) || 3001;

app.listen(PORT_NUM, '0.0.0.0', () => {
  console.log(`[OK] Servidor backend ejecutandose en http://127.0.0.1:${PORT_NUM} y http://localhost:${PORT_NUM}`);
});


import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateRut, formatRut } from '../../shared/rut';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper para generar el próximo código de ticket con formato TCK-YYYY-XXXX
async function generarCodigoTicket(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `TCK-${currentYear}-`;

  // Buscar el último ticket creado en el año actual
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
// 1. GET /api/usuarios/:rut
// Devuelve nombre y departamento si existe
// ==========================================
app.get('/api/usuarios/:rut', async (req: Request, res: Response) => {
  try {
    const rawRut = Array.isArray(req.params.rut) ? req.params.rut[0] : req.params.rut;
    if (!rawRut) {
      return res.status(400).json({ error: 'RUT es requerido' });
    }

    const rut = formatRut(rawRut);
    if (!validateRut(rut)) {
      return res.status(400).json({ error: 'El RUT ingresado no es válido según algoritmo Módulo 11' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { rut },
      select: {
        id: true,
        rut: true,
        nombre: true,
        departamento: true,
        email: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado con el RUT ingresado' });
    }

    return res.json(usuario);
  } catch (error) {
    console.error('Error al buscar usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor al consultar usuario' });
  }
});

// ==========================================
// 2. POST /api/tickets
// Crea ticket revalidando el RUT y todos los campos obligatorios
// ==========================================
const crearTicketSchema = z.object({
  rut: z.string().min(1, 'El RUT es obligatorio'),
  categoria: z.string().min(1, 'La categoría es obligatoria'),
  prioridad: z.enum(['baja', 'media', 'alta', 'critica'], {
    errorMap: () => ({ message: 'Prioridad inválida. Debe ser: baja, media, alta o critica' })
  }),
  descripcion: z.string().min(5, 'La descripción debe tener al menos 5 caracteres')
});

app.post('/api/tickets', async (req: Request, res: Response) => {
  try {
    // Validar formato de los campos recibidos en el servidor con Zod
    const validationResult = crearTicketSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: validationResult.error.flatten().fieldErrors
      });
    }

    const { rut: rawRut, categoria, prioridad, descripcion } = validationResult.data;

    // Normalizar y revalidar RUT con Módulo 11 (regla de oro: nunca confiar solo en frontend)
    const rut = formatRut(rawRut);
    if (!validateRut(rut)) {
      return res.status(400).json({
        error: 'El RUT provisto no es un RUT chileno válido (Módulo 11)'
      });
    }

    // Verificar existencia del usuario en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { rut }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'El usuario asociado al RUT no está registrado en el sistema'
      });
    }

    // Generar código correlativo único (ej: TCK-2026-0001)
    const codigo = await generarCodigoTicket();

    const nuevoTicket = await prisma.ticket.create({
      data: {
        codigo,
        usuarioId: usuario.id,
        categoria,
        prioridad,
        estado: 'abierto',
        descripcion
      },
      include: {
        usuario: {
          select: {
            id: true,
            rut: true,
            nombre: true,
            departamento: true,
            email: true
          }
        }
      }
    });

    return res.status(201).json(nuevoTicket);
  } catch (error) {
    console.error('Error al crear ticket:', error);
    return res.status(500).json({ error: 'Error interno del servidor al crear el ticket' });
  }
});

// ==========================================
// 3. GET /api/tickets
// Lista todos los tickets, más recientes primero
// ==========================================
app.get('/api/tickets', async (_req: Request, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: {
        creadoEn: 'desc'
      },
      include: {
        usuario: {
          select: {
            id: true,
            rut: true,
            nombre: true,
            departamento: true,
            email: true
          }
        }
      }
    });

    return res.json(tickets);
  } catch (error) {
    console.error('Error al listar tickets:', error);
    return res.status(500).json({ error: 'Error interno del servidor al listar tickets' });
  }
});

// ==========================================
// 4. PATCH /api/tickets/:id/estado
// Cambia el estado de un ticket
// ==========================================
const actualizarEstadoSchema = z.object({
  estado: z.enum(['abierto', 'en_proceso', 'resuelto', 'cerrado'], {
    errorMap: () => ({ message: 'Estado inválido. Debe ser: abierto, en_proceso, resuelto o cerrado' })
  })
});

app.patch('/api/tickets/:id/estado', async (req: Request, res: Response) => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID de ticket inválido' });
    }

    const validationResult = actualizarEstadoSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: validationResult.error.flatten().fieldErrors
      });
    }

    const { estado } = validationResult.data;

    // Verificar si el ticket existe
    const ticketExistente = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticketExistente) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const ticketActualizado = await prisma.ticket.update({
      where: { id },
      data: { estado },
      include: {
        usuario: {
          select: {
            id: true,
            rut: true,
            nombre: true,
            departamento: true,
            email: true
          }
        }
      }
    });

    return res.json(ticketActualizado);
  } catch (error) {
    console.error('Error al actualizar estado del ticket:', error);
    return res.status(500).json({ error: 'Error interno del servidor al actualizar el estado' });
  }
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✓ Servidor backend ejecutándose en http://localhost:${PORT}`);
});

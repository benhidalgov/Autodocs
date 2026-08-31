import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { validateRut, formatRut } from '../../shared/rut';

const prisma = new PrismaClient();

const usuariosEjemplo = [
  {
    rut: '11222333-9',
    nombre: 'Carlos Eduardo Mendoza Morales',
    departamento: 'Tecnología e Infraestructura',
    email: 'admin@empresa.cl',
    passwordPlano: 'admin2026',
    rol: 'SUPERVISOR_ADMIN'
  },
  {
    rut: '15678912-7',
    nombre: 'Valentina Paz Rojas Vega',
    departamento: 'Mesa de Ayuda y Operaciones',
    email: 'soporte@empresa.cl',
    passwordPlano: 'soporte2026',
    rol: 'AGENTE_SOPORTE'
  },
  {
    rut: '12345678-5',
    nombre: 'Ana María Silva Castro',
    departamento: 'Recursos Humanos',
    email: 'ana.silva@empresa.cl',
    passwordPlano: 'usuario2026',
    rol: 'SOLICITANTE'
  },
  {
    rut: '18765432-7',
    nombre: 'Gonzalo Andrés Pinto Flores',
    departamento: 'Finanzas y Contabilidad',
    email: 'gonzalo.pinto@empresa.cl',
    passwordPlano: 'usuario2026',
    rol: 'SOLICITANTE'
  },
  {
    rut: '20123456-5',
    nombre: 'Camila Ignacia Carrasco Baeza',
    departamento: 'Comercial y Marketing',
    email: 'camila.carrasco@empresa.cl',
    passwordPlano: 'usuario2026',
    rol: 'SOLICITANTE'
  }
];

async function main() {
  console.log('[INFO] Iniciando carga de datos de usuarios y perfiles RBAC...');

  const usuariosCreados: Record<string, any> = {};

  for (const u of usuariosEjemplo) {
    const formattedRut = formatRut(u.rut);
    if (!validateRut(formattedRut)) {
      throw new Error(`[ERROR] RUT invalido detectado en el seed: ${u.rut}`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(u.passwordPlano, salt);

    const usuario = await prisma.usuario.upsert({
      where: { rut: formattedRut },
      update: {
        nombre: u.nombre,
        departamento: u.departamento,
        email: u.email,
        passwordHash,
        rol: u.rol,
        activo: true
      },
      create: {
        rut: formattedRut,
        nombre: u.nombre,
        departamento: u.departamento,
        email: u.email,
        passwordHash,
        rol: u.rol,
        activo: true
      }
    });

    usuariosCreados[u.email] = usuario;
    console.log(`[OK] Usuario cargado: ${usuario.nombre} (${usuario.rut}) [${usuario.rol}] - ${usuario.email}`);
  }

  // Cargar tickets demostrativos con comentarios
  const admin = usuariosCreados['admin@empresa.cl'];
  const soporte = usuariosCreados['soporte@empresa.cl'];
  const ana = usuariosCreados['ana.silva@empresa.cl'];
  const gonzalo = usuariosCreados['gonzalo.pinto@empresa.cl'];

  const countTickets = await prisma.ticket.count();
  if (countTickets === 0) {
    // Ticket 1: Alta prioridad, asignado a soporte, con notas internas y publicas
    const ticket1 = await prisma.ticket.create({
      data: {
        codigo: 'TCK-2026-0001',
        solicitanteId: ana.id,
        tecnicoId: soporte.id,
        categoria: 'Software / Accesos',
        prioridad: 'alta',
        estado: 'en_proceso',
        descripcion: 'Falla al acceder a la VPN corporativa desde el equipo portatil. Retorna error de autenticacion Radius.',
        ciAfectado: 'BALANCER001',
        slaLimiteMinutos: 120
      }
    });

    await prisma.comentario.create({
      data: {
        ticketId: ticket1.id,
        autorId: soporte.id,
        contenido: 'Estimada Ana Maria, hemos recibido su ticket. Estamos verificando los perfiles de acceso en el servidor de directorio.',
        esInterno: false
      }
    });

    await prisma.comentario.create({
      data: {
        ticketId: ticket1.id,
        autorId: soporte.id,
        contenido: '[NOTA TECNICA] Se detecto sincronizacion desfasada en el cluster LDAP asociado a BALANCER001. Requiere reinicio del demonio keepalived.',
        esInterno: true
      }
    });

    // Ticket 2: Critico de Finanzas, resuelto
    const ticket2 = await prisma.ticket.create({
      data: {
        codigo: 'TCK-2026-0002',
        solicitanteId: gonzalo.id,
        tecnicoId: admin.id,
        categoria: 'Infraestructura / BD',
        prioridad: 'critica',
        estado: 'resuelto',
        descripcion: 'Timeout persistente (504 Gateway) al emitir reporte mensual de facturacion en ERP.',
        ciAfectado: 'PRODMIDWARE003',
        slaLimiteMinutos: 60,
        resueltoEn: new Date()
      }
    });

    await prisma.comentario.create({
      data: {
        ticketId: ticket2.id,
        autorId: admin.id,
        contenido: '[DIAGNOSTICO RCA] Se confirmo saturacion de hilos Synapse en WSO2 Gateway. Se ejecuto runbook de mitigacion y se restablecio la conexion JDBC.',
        esInterno: true
      }
    });

    await prisma.comentario.create({
      data: {
        ticketId: ticket2.id,
        autorId: admin.id,
        contenido: 'Estimado Gonzalo, el servicio de reportes ha sido restablecido con exito tras optimizar el pool de conexiones del servidor.',
        esInterno: false
      }
    });

    // Ticket 3: Abierto sin asignar
    await prisma.ticket.create({
      data: {
        codigo: 'TCK-2026-0003',
        solicitanteId: ana.id,
        categoria: 'Hardware / Perifericos',
        prioridad: 'baja',
        estado: 'abierto',
        descripcion: 'Solicitud de cable HDMI y adaptador DisplayPort para sala de reuniones Piso 4.',
        slaLimiteMinutos: 480
      }
    });

    console.log('[OK] Tickets de demostracion con comentarios cargados exitosamente.');
  }

  console.log('[OK] Seed completado con exito.');
}

main()
  .catch((e) => {
    console.error('[CRIT] Error al ejecutar el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


import { PrismaClient } from '@prisma/client';
import { validateRut, formatRut } from '../../shared/rut';

const prisma = new PrismaClient();

const usuariosEjemplo = [
  {
    rut: '12345678-5',
    nombre: 'Ana María Silva Castro',
    departamento: 'Recursos Humanos',
    email: 'ana.silva@empresa.cl'
  },
  {
    rut: '11222333-9',
    nombre: 'Carlos Eduardo Mendoza Morales',
    departamento: 'Tecnología y Sistemas',
    email: 'carlos.mendoza@empresa.cl'
  },
  {
    rut: '15678912-7',
    nombre: 'Valentina Paz Rojas Vega',
    departamento: 'Operaciones y Logística',
    email: 'valentina.rojas@empresa.cl'
  },
  {
    rut: '18765432-7',
    nombre: 'Gonzalo Andrés Pinto Flores',
    departamento: 'Finanzas y Contabilidad',
    email: 'gonzalo.pinto@empresa.cl'
  },
  {
    rut: '20123456-5',
    nombre: 'Camila Ignacia Carrasco Baeza',
    departamento: 'Comercial y Marketing',
    email: 'camila.carrasco@empresa.cl'
  }
];

async function main() {
  console.log('Iniciando carga de datos de ejemplo (seed)...');

  for (const u of usuariosEjemplo) {
    const formattedRut = formatRut(u.rut);
    if (!validateRut(formattedRut)) {
      throw new Error(`RUT inválido detectado en el seed: ${u.rut}`);
    }

    const usuario = await prisma.usuario.upsert({
      where: { rut: formattedRut },
      update: {
        nombre: u.nombre,
        departamento: u.departamento,
        email: u.email
      },
      create: {
        rut: formattedRut,
        nombre: u.nombre,
        departamento: u.departamento,
        email: u.email
      }
    });

    console.log(`✓ Usuario cargado: ${usuario.nombre} (${usuario.rut}) - ${usuario.departamento}`);
  }

  // Opcional: Crear 2 tickets iniciales para visualización inmediata si no existen
  const primerUsuario = await prisma.usuario.findUnique({ where: { rut: '11222333-9' } });
  if (primerUsuario) {
    const countTickets = await prisma.ticket.count();
    if (countTickets === 0) {
      await prisma.ticket.create({
        data: {
          codigo: 'TCK-2026-0001',
          usuarioId: primerUsuario.id,
          categoria: 'Software',
          prioridad: 'alta',
          estado: 'abierto',
          descripcion: 'Falla al acceder a la VPN corporativa desde el equipo portátil.'
        }
      });

      const segundoUsuario = await prisma.usuario.findUnique({ where: { rut: '12345678-5' } });
      if (segundoUsuario) {
        await prisma.ticket.create({
          data: {
            codigo: 'TCK-2026-0002',
            usuarioId: segundoUsuario.id,
            categoria: 'Hardware',
            prioridad: 'media',
            estado: 'en_proceso',
            descripcion: 'Monitor adicional parpadea intermitentemente al encender.'
          }
        });
      }
      console.log('✓ Tickets de demostración iniciales creados.');
    }
  }

  console.log('Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error al ejecutar el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

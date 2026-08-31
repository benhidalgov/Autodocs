import { TicketDTO, UsuarioDTO, CrearTicketPayload, Estado } from '@shared/types';
import { formatRut } from '@shared/rut';

const API_BASE = '/api';

// Usuarios de prueba predeterminados con RUT chileno válido (Módulo 11)
const USUARIOS_DEMO: UsuarioDTO[] = [
  {
    id: 1,
    rut: '12345678-5',
    nombre: 'Ana María Silva Castro',
    departamento: 'Recursos Humanos',
    email: 'ana.silva@empresa.cl'
  },
  {
    id: 2,
    rut: '11222333-9',
    nombre: 'Carlos Eduardo Mendoza Morales',
    departamento: 'Tecnología y Sistemas',
    email: 'carlos.mendoza@empresa.cl'
  },
  {
    id: 3,
    rut: '15678912-7',
    nombre: 'Valentina Paz Rojas Vega',
    departamento: 'Operaciones y Logística',
    email: 'valentina.rojas@empresa.cl'
  },
  {
    id: 4,
    rut: '18765432-7',
    nombre: 'Gonzalo Andrés Pinto Flores',
    departamento: 'Finanzas y Contabilidad',
    email: 'gonzalo.pinto@empresa.cl'
  },
  {
    id: 5,
    rut: '20123456-5',
    nombre: 'Camila Ignacia Carrasco Baeza',
    departamento: 'Comercial y Marketing',
    email: 'camila.carrasco@empresa.cl'
  }
];

const TICKETS_INICIALES: TicketDTO[] = [
  {
    id: 1,
    codigo: 'TCK-2026-0001',
    usuarioId: 2,
    categoria: 'Software',
    prioridad: 'alta',
    estado: 'abierto',
    descripcion: 'Falla al acceder a la VPN corporativa desde el equipo portátil.',
    creadoEn: '2026-08-31T08:00:00.000Z',
    usuario: USUARIOS_DEMO[1]
  },
  {
    id: 2,
    codigo: 'TCK-2026-0002',
    usuarioId: 1,
    categoria: 'Hardware',
    prioridad: 'media',
    estado: 'en_proceso',
    descripcion: 'Monitor adicional parpadea intermitentemente al encender.',
    creadoEn: '2026-08-31T08:15:00.000Z',
    usuario: USUARIOS_DEMO[0]
  }
];

// Helper para almacenamiento local en el navegador (para demostraciones en Vercel)
function obtenerTicketsLocales(): TicketDTO[] {
  try {
    const saved = localStorage.getItem('autodocs_tickets');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return TICKETS_INICIALES;
}

function guardarTicketsLocales(tickets: TicketDTO[]) {
  try {
    localStorage.setItem('autodocs_tickets', JSON.stringify(tickets));
  } catch {}
}

export async function fetchUsuarioPorRut(rut: string): Promise<UsuarioDTO> {
  const formatted = formatRut(rut);
  try {
    const res = await fetch(`${API_BASE}/usuarios/${encodeURIComponent(formatted)}`);
    if (res.ok) {
      return await res.json();
    }
    // Si el backend responde con error 404 o similar de validación
    const errData = await res.json().catch(() => ({}));
    if (res.status === 404 && !errData.error?.includes('Cannot GET')) {
      throw new Error(errData.error || 'Usuario no encontrado con el RUT ingresado');
    }
  } catch (err: any) {
    // Si el error es un 404 de "Usuario no encontrado" devuelto por el servidor, propagarlo
    if (err.message && err.message.includes('Usuario no encontrado')) {
      throw err;
    }
    // Si no hay backend (ej: Vercel estático), usar la lista demo local
  }

  // Fallback demo para Vercel o modo desconectado
  const encontrado = USUARIOS_DEMO.find((u) => u.rut === formatted);
  if (!encontrado) {
    throw new Error('El RUT no está registrado en la base de usuarios de prueba.');
  }
  return encontrado;
}

export async function fetchTickets(): Promise<TicketDTO[]> {
  try {
    const res = await fetch(`${API_BASE}/tickets`);
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Fallback local en navegador (Vercel)
  return obtenerTicketsLocales();
}

export async function crearTicket(data: CrearTicketPayload): Promise<TicketDTO> {
  const formatted = formatRut(data.rut);

  try {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, rut: formatted })
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    if (res.status < 500 && errData.error) {
      throw new Error(errData.error);
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
  }

  // Fallback demo en navegador (Vercel)
  const usuario = USUARIOS_DEMO.find((u) => u.rut === formatted);
  if (!usuario) {
    throw new Error('El usuario asociado al RUT no está registrado en el sistema');
  }

  const tickets = obtenerTicketsLocales();
  const year = new Date().getFullYear();
  const nextSeq = (tickets.length + 1).toString().padStart(4, '0');
  const nuevoTicket: TicketDTO = {
    id: Date.now(),
    codigo: `TCK-${year}-${nextSeq}`,
    usuarioId: usuario.id,
    categoria: data.categoria,
    prioridad: data.prioridad,
    estado: 'abierto',
    descripcion: data.descripcion,
    creadoEn: new Date().toISOString(),
    usuario
  };

  const actualizados = [nuevoTicket, ...tickets];
  guardarTicketsLocales(actualizados);
  return nuevoTicket;
}

export async function actualizarEstadoTicket(id: number, nuevoEstado: Estado): Promise<TicketDTO> {
  try {
    const res = await fetch(`${API_BASE}/tickets/${id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Fallback local en navegador (Vercel)
  const tickets = obtenerTicketsLocales();
  const index = tickets.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error('Ticket no encontrado');
  }

  tickets[index].estado = nuevoEstado;
  guardarTicketsLocales(tickets);
  return tickets[index];
}

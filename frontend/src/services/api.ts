import {
  TicketDTO,
  UsuarioDTO,
  CrearTicketPayload,
  Estado,
  LoginPayload,
  AuthResponse,
  ComentarioDTO,
  CrearComentarioPayload,
  MetricasSLADTO
} from '@shared/types';
import { formatRut } from '@shared/rut';

const API_BASE = '/api';
const TOKEN_KEY = 'tickets_auth_token';

// Gestion de Token JWT en almacenamiento local
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getHeaders(isJson = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Fallback de demostracion
export const USUARIOS_DEMO: UsuarioDTO[] = [
  {
    id: 1,
    rut: '11222333-9',
    nombre: 'Pablo Administrador',
    departamento: 'Infraestructura y Redes (SMU / Unicard)',
    email: 'pablo@unicard.cl',
    rol: 'SUPERVISOR_ADMIN'
  },
  {
    id: 2,
    rut: '15678912-7',
    nombre: 'Valentina Paz Rojas Vega',
    departamento: 'Mesa de Ayuda y Operaciones TI',
    email: 'soporte@smu.cl',
    rol: 'AGENTE_SOPORTE'
  },
  {
    id: 3,
    rut: '12345678-5',
    nombre: 'Ana María Silva Castro',
    departamento: 'Recursos Humanos (SMU)',
    email: 'ana.silva@smu.cl',
    rol: 'SOLICITANTE'
  },
  {
    id: 4,
    rut: '18765432-7',
    nombre: 'Gonzalo Andrés Pinto Flores',
    departamento: 'Finanzas y Medios de Pago (Unicard)',
    email: 'gonzalo.pinto@unicard.cl',
    rol: 'SOLICITANTE'
  },
  {
    id: 5,
    rut: '20123456-5',
    nombre: 'Camila Ignacia Carrasco Baeza',
    departamento: 'Comercial y Marketing (SMU)',
    email: 'camila.carrasco@smu.cl',
    rol: 'SOLICITANTE'
  }
];

// ==========================================
// 1. AUTENTICACION
// ==========================================
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '[ERROR] Error al iniciar sesion');
  }

  setAuthToken(data.token);
  return data;
}

export async function fetchPerfil(): Promise<UsuarioDTO> {
  const res = await fetch(`${API_BASE}/auth/perfil`, {
    headers: getHeaders()
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '[ERROR] Error al recuperar sesion');
  }
  return data;
}

// ==========================================
// 2. CONSULTAS DE USUARIOS
// ==========================================
export async function fetchUsuarioPorRut(rut: string): Promise<UsuarioDTO> {
  const formatted = formatRut(rut);
  try {
    const res = await fetch(`${API_BASE}/usuarios/${encodeURIComponent(formatted)}`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => ({}));
    if (res.status === 404 && !errData.error?.includes('Cannot GET')) {
      throw new Error(errData.error || '[ERROR] Usuario no encontrado con el RUT ingresado');
    }
  } catch (err: any) {
    if (err.message && err.message.includes('Usuario no encontrado')) {
      throw err;
    }
  }

  const encontrado = USUARIOS_DEMO.find((u) => u.rut === formatted);
  if (!encontrado) {
    throw new Error('[ERROR] El RUT no esta registrado en el sistema.');
  }
  return encontrado;
}

export async function fetchTecnicos(): Promise<UsuarioDTO[]> {
  try {
    const res = await fetch(`${API_BASE}/soporte/tecnicos`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return USUARIOS_DEMO.filter((u) => u.rol === 'AGENTE_SOPORTE' || u.rol === 'SUPERVISOR_ADMIN');
}

// ==========================================
// 3. GESTION DE TICKETS
// ==========================================
export async function fetchMisTickets(): Promise<TicketDTO[]> {
  const res = await fetch(`${API_BASE}/mis-tickets`, {
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '[ERROR] Error al recuperar mis tickets');
  }
  return await res.json();
}

export async function fetchTickets(filtros?: {
  estado?: string;
  departamento?: string;
  categoria?: string;
  prioridad?: string;
  busqueda?: string;
}): Promise<TicketDTO[]> {
  const params = new URLSearchParams();
  if (filtros?.estado && filtros.estado !== 'todos') params.append('estado', filtros.estado);
  if (filtros?.departamento && filtros.departamento !== 'todos') params.append('departamento', filtros.departamento);
  if (filtros?.categoria && filtros.categoria !== 'todos') params.append('categoria', filtros.categoria);
  if (filtros?.prioridad && filtros.prioridad !== 'todos') params.append('prioridad', filtros.prioridad);
  if (filtros?.busqueda) params.append('busqueda', filtros.busqueda);

  const url = `${API_BASE}/tickets${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '[ERROR] Error al listar tickets');
  }
  return await res.json();
}

export async function fetchTicketDetalle(id: number): Promise<TicketDTO> {
  const res = await fetch(`${API_BASE}/tickets/${id}`, {
    headers: getHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || '[ERROR] Error al consultar detalle del ticket');
  }
  return await res.json();
}

export async function crearTicket(data: CrearTicketPayload): Promise<TicketDTO> {
  const formattedRut = data.rut ? formatRut(data.rut) : undefined;

  const res = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ...data, rut: formattedRut })
  });

  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error || '[ERROR] Error al crear ticket');
  }
  return resData;
}

export async function agregarComentario(
  ticketId: number,
  payload: CrearComentarioPayload
): Promise<ComentarioDTO> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/comentarios`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });

  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error || '[ERROR] Error al publicar comentario');
  }
  return resData;
}

export async function actualizarEstadoTicket(
  id: number,
  nuevoEstado: Estado,
  ciAfectado?: string
): Promise<TicketDTO> {
  const res = await fetch(`${API_BASE}/tickets/${id}/estado`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ estado: nuevoEstado, ciAfectado })
  });

  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error || '[ERROR] Error al actualizar estado del ticket');
  }
  return resData;
}

export async function asignarTecnicoTicket(
  id: number,
  tecnicoId: number | null
): Promise<TicketDTO> {
  const res = await fetch(`${API_BASE}/tickets/${id}/asignar`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ tecnicoId })
  });

  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error || '[ERROR] Error al asignar tecnico');
  }
  return resData;
}

// ==========================================
// 4. METRICAS SLA & ANALITICAS
// ==========================================
export async function fetchMetricasSLA(): Promise<MetricasSLADTO> {
  const res = await fetch(`${API_BASE}/admin/metricas-sla`, {
    headers: getHeaders()
  });

  const resData = await res.json();
  if (!res.ok) {
    throw new Error(resData.error || '[ERROR] Error al consultar metricas analiticas');
  }
  return resData;
}


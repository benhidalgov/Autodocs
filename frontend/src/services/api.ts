import { TicketDTO, UsuarioDTO, CrearTicketPayload, Estado } from '@shared/types';

const API_BASE = '/api';

export async function fetchUsuarioPorRut(rut: string): Promise<UsuarioDTO> {
  const res = await fetch(`${API_BASE}/usuarios/${encodeURIComponent(rut)}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al buscar el usuario');
  }
  return res.json();
}

export async function fetchTickets(): Promise<TicketDTO[]> {
  const res = await fetch(`${API_BASE}/tickets`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al obtener tickets');
  }
  return res.json();
}

export async function crearTicket(data: CrearTicketPayload): Promise<TicketDTO> {
  const res = await fetch(`${API_BASE}/tickets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al crear el ticket');
  }

  return res.json();
}

export async function actualizarEstadoTicket(id: number, nuevoEstado: Estado): Promise<TicketDTO> {
  const res = await fetch(`${API_BASE}/tickets/${id}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ estado: nuevoEstado })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error al actualizar el estado del ticket');
  }

  return res.json();
}

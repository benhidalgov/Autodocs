export type Prioridad = 'baja' | 'media' | 'alta' | 'critica';
export type Estado = 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado';

export interface UsuarioDTO {
  id: number;
  rut: string;
  nombre: string;
  departamento: string;
  email: string;
}

export interface TicketDTO {
  id: number;
  codigo: string;
  usuarioId: number;
  categoria: string;
  prioridad: Prioridad;
  estado: Estado;
  descripcion: string;
  creadoEn: string;
  usuario?: UsuarioDTO;
}

export interface CrearTicketPayload {
  rut: string;
  categoria: string;
  prioridad: Prioridad;
  descripcion: string;
}

export interface ActualizarEstadoPayload {
  estado: Estado;
}

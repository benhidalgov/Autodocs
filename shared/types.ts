export type RolUsuario = 'SOLICITANTE' | 'AGENTE_SOPORTE' | 'SUPERVISOR_ADMIN';
export type Prioridad = 'baja' | 'media' | 'alta' | 'critica';
export type Estado = 'abierto' | 'en_proceso' | 'pendiente_usuario' | 'resuelto' | 'cerrado';

export interface UsuarioDTO {
  id: number;
  rut: string;
  nombre: string;
  departamento: string;
  email: string;
  rol: RolUsuario;
  activo?: boolean;
  creadoEn?: string;
}

export interface ComentarioDTO {
  id: number;
  ticketId: number;
  autorId: number;
  autor?: UsuarioDTO;
  contenido: string;
  esInterno: boolean;
  creadoEn: string;
}

export interface TicketDTO {
  id: number;
  codigo: string;
  solicitanteId: number;
  solicitante?: UsuarioDTO;
  tecnicoId?: number | null;
  tecnico?: UsuarioDTO | null;
  categoria: string;
  prioridad: Prioridad;
  estado: Estado;
  descripcion: string;
  ciAfectado?: string | null;
  slaLimiteMinutos?: number;
  creadoEn: string;
  actualizadoEn?: string;
  resueltoEn?: string | null;
  comentarios?: ComentarioDTO[];
}

export interface LoginPayload {
  identificador: string; // Puede ser RUT o Email
  password: string;
}

export interface AuthResponse {
  token: string;
  usuario: UsuarioDTO;
}

export interface CrearTicketPayload {
  rut?: string;
  categoria: string;
  prioridad: Prioridad;
  descripcion: string;
  ciAfectado?: string;
}

export interface ActualizarEstadoPayload {
  estado: Estado;
  ciAfectado?: string;
}

export interface AsignarTecnicoPayload {
  tecnicoId: number | null;
}

export interface CrearComentarioPayload {
  contenido: string;
  esInterno?: boolean;
}

export interface MetricasSLADTO {
  totalTickets: number;
  abiertos: number;
  enProceso: number;
  resueltos: number;
  cerrados: number;
  criticosActivos: number;
  mttrPromedioMinutos: number;
  cumplimientoSlaPorcentaje: number;
  distribucionCategorias: { categoria: string; cantidad: number }[];
  distribucionDepartamentos: { departamento: string; cantidad: number }[];
}


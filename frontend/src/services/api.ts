import {
  TicketDTO,
  UsuarioDTO,
  CrearTicketPayload,
  Estado,
  LoginPayload,
  AuthResponse,
  ComentarioDTO,
  CrearComentarioPayload,
  MetricasSLADTO,
  ElementoCMDB,
  SugerenciaRCADTO,
  CorrelacionIncidentesDTO
} from '@shared/types';
import { formatRut } from '@shared/rut';

const API_BASE = '/api';
const TOKEN_KEY = 'tickets_auth_token';
const USER_KEY = 'tickets_auth_user';

// ==========================================
// 1. GESTION DE TOKEN Y SESION LOCAL
// ==========================================
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getStoredUser(): UsuarioDTO | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: UsuarioDTO) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
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

// ==========================================
// 2. DATOS DE DEMOSTRACION / FALLBACK
// ==========================================
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

export const CATALOGO_CMDB_LOCAL: ElementoCMDB[] = [
  {
    id: 'HPE_Synergy',
    nombre: 'HPE Synergy 12000 Frame',
    capa: 'L1_HARDWARE',
    criticidad: 'CRITICA',
    ip: '10.24.0.10',
    ambiente: 'PRODUCCION',
    descripcion: 'Chasis modular blade principal que aloja el computo de produccion Unicard y SMU.',
    palabrasClave: ['chasis', 'hardware', 'synergy', 'blade'],
    dependencias: [],
    runbookSugerido: 'RB-HW-001: Procedimiento de contingencia y conmutacion de chasis Synergy'
  },
  {
    id: 'SAN_PureStorage',
    nombre: 'Pure Storage FlashArray //X50',
    capa: 'L1_HARDWARE',
    criticidad: 'CRITICA',
    ip: '10.24.0.20',
    ambiente: 'PRODUCCION',
    descripcion: 'Arreglo NVMe de almacenamiento de ultra baja latencia para bases de datos y maquinas virtuales.',
    palabrasClave: ['almacenamiento', 'storage', 'san', 'nvme'],
    dependencias: ['HPE_Synergy'],
    runbookSugerido: 'RB-STO-004: Diagnostico de latencia en controladoras FlashArray'
  },
  {
    id: 'FIREWALL_CORE',
    nombre: 'Fortinet FortiGate 600E (Cluster HA)',
    capa: 'L1_HARDWARE',
    criticidad: 'CRITICA',
    ip: '10.24.0.1',
    ambiente: 'PRODUCCION',
    descripcion: 'Perimetro de seguridad y enrutamiento central de sucursales SMU y Unicard.',
    palabrasClave: ['firewall', 'red', 'seguridad', 'vpn', 'radius'],
    dependencias: [],
    runbookSugerido: 'RB-SEC-002: Verificacion de politicas y reglas de firewall perimetral'
  },
  {
    id: 'ClusterBL',
    nombre: 'VMware vSphere Cluster Blades (ESXi 8.0)',
    capa: 'L2_VIRTUALIZACION',
    criticidad: 'CRITICA',
    ip: '10.24.0.50',
    ambiente: 'PRODUCCION',
    descripcion: 'Cluster de virtualizacion para cargas de trabajo Linux y contenedores.',
    palabrasClave: ['cluster', 'esxi', 'vmware'],
    dependencias: ['HPE_Synergy', 'SAN_PureStorage'],
    runbookSugerido: 'RB-VIRT-003: Balanceo de carga y remediacion DRS en ESXi'
  },
  {
    id: 'BALANCER001',
    nombre: 'HAProxy / NGINX Ingress Balancer 01',
    capa: 'L3_MIDDLEWARE',
    criticidad: 'CRITICA',
    ip: '10.24.0.125',
    ambiente: 'PRODUCCION',
    descripcion: 'Balanceador de carga primario para distribucion de trafico transaccional.',
    palabrasClave: ['balancer', 'haproxy', '502', '503', '504', 'keepalived', 'timeout', 'vpn'],
    dependencias: ['ClusterBL', 'FIREWALL_CORE'],
    runbookSugerido: 'RB-NET-008: Procedimiento de reinicio seguro de demonio Keepalived/HAProxy'
  },
  {
    id: 'PRODMIDWARE003',
    nombre: 'WSO2 Enterprise Integrator / API Gateway',
    capa: 'L3_MIDDLEWARE',
    criticidad: 'CRITICA',
    ip: '10.24.2.30',
    ambiente: 'PRODUCCION',
    descripcion: 'Bus de integracion y pasarela de orquestacion para microservicios y ERP.',
    palabrasClave: ['middleware', 'wso2', 'gateway', 'api', 'synapse', 'facturacion'],
    dependencias: ['ClusterBL', 'BALANCER001'],
    runbookSugerido: 'RB-MID-002: Desahogo de pool de conexiones y reinicio ordenado WSO2'
  },
  {
    id: 'CREDITMAKER',
    nombre: 'CreditMaker - Core Tablet Venta y Emision',
    capa: 'L4_APLICACION',
    criticidad: 'CRITICA',
    ip: '10.24.3.10',
    ambiente: 'PRODUCCION',
    descripcion: 'Aplicacion core de originacion y venta de tarjetas de credito Unicard en sucursales.',
    palabrasClave: ['creditmaker', 'tablet', 'venta', 'tarjeta', 'unicard'],
    dependencias: ['PRODMIDWARE003', 'BALANCER001'],
    runbookSugerido: 'RB-APP-012: Contingencia de terminales de venta CreditMaker'
  },
  {
    id: 'ENGAGE_SQL_1',
    nombre: 'Microsoft SQL Server 2012 / Core DB',
    capa: 'L4_APLICACION',
    criticidad: 'CRITICA',
    ip: '10.24.3.50',
    ambiente: 'PRODUCCION',
    descripcion: 'Base de datos relacional principal para clientes, limites y transacciones.',
    palabrasClave: ['sql', 'base de datos', 'database', 'deadlock', 'engage'],
    dependencias: ['SAN_PureStorage'],
    runbookSugerido: 'RB-DB-007: Identificacion y terminacion de procesos con Deadlock en SQL Server'
  },
  {
    id: 'PORTAL_AUTOATENCION',
    nombre: 'Portal Web de Autoservicio y Clientes',
    capa: 'L4_APLICACION',
    criticidad: 'ALTA',
    ip: '10.24.3.80',
    ambiente: 'PRODUCCION',
    descripcion: 'Portal web corporativo para consulta de estados de cuenta y atencion a clientes.',
    palabrasClave: ['portal', 'web', 'autoservicio', 'login'],
    dependencias: ['BALANCER001'],
    runbookSugerido: 'RB-WEB-003: Reescalado de replicas en Ingress para Portal de Clientes'
  },
  {
    id: 'ERP_SAP_FINANZAS',
    nombre: 'ERP SAP Finanzas y Contabilidad SMU',
    capa: 'L4_APLICACION',
    criticidad: 'CRITICA',
    ip: '10.24.4.10',
    ambiente: 'PRODUCCION',
    descripcion: 'Sistema de gestion financiera, tesoreria, pago a proveedores y facturacion.',
    palabrasClave: ['erp', 'sap', 'finanzas', 'facturacion', 'contabilidad'],
    dependencias: ['PRODMIDWARE003', 'SAN_PureStorage'],
    runbookSugerido: 'RB-ERP-009: Reinicio de instancias de aplicacion SAP Dispatcher'
  }
];

let TICKETS_MEMORIA: TicketDTO[] = [
  {
    id: 1,
    codigo: 'TCK-2026-0001',
    solicitanteId: 3,
    solicitante: USUARIOS_DEMO[2],
    tecnicoId: 2,
    tecnico: USUARIOS_DEMO[1],
    categoria: 'Redes y Conectividad',
    prioridad: 'alta',
    estado: 'en_proceso',
    descripcion: 'Falla al acceder a la VPN corporativa desde el equipo portatil. Retorna error de autenticacion Radius.',
    ciAfectado: 'BALANCER001',
    slaLimiteMinutos: 120,
    creadoEn: new Date(Date.now() - 3600000).toISOString(),
    comentarios: [
      {
        id: 1,
        ticketId: 1,
        autorId: 2,
        autor: USUARIOS_DEMO[1],
        contenido: 'Estimada Ana Maria, hemos recibido su ticket. Estamos verificando los perfiles de acceso en el cluster.',
        esInterno: false,
        creadoEn: new Date(Date.now() - 2400000).toISOString()
      },
      {
        id: 2,
        ticketId: 1,
        autorId: 2,
        autor: USUARIOS_DEMO[1],
        contenido: '[NOTA TECNICA] Se detecto sincronizacion desfasada en el cluster LDAP asociado a BALANCER001.',
        esInterno: true,
        creadoEn: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  },
  {
    id: 2,
    codigo: 'TCK-2026-0002',
    solicitanteId: 4,
    solicitante: USUARIOS_DEMO[3],
    tecnicoId: 1,
    tecnico: USUARIOS_DEMO[0],
    categoria: 'Software',
    prioridad: 'critica',
    estado: 'resuelto',
    descripcion: 'Timeout persistente (504 Gateway) al emitir reporte mensual de facturacion en ERP.',
    ciAfectado: 'PRODMIDWARE003',
    slaLimiteMinutos: 60,
    creadoEn: new Date(Date.now() - 7200000).toISOString(),
    resueltoEn: new Date(Date.now() - 1200000).toISOString(),
    comentarios: [
      {
        id: 3,
        ticketId: 2,
        autorId: 1,
        autor: USUARIOS_DEMO[0],
        contenido: '[DIAGNOSTICO RCA] Se confirmo saturacion de hilos Synapse en WSO2 Gateway. Se ejecuto runbook de mitigacion.',
        esInterno: true,
        creadoEn: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 4,
        ticketId: 2,
        autorId: 1,
        autor: USUARIOS_DEMO[0],
        contenido: 'Estimado Gonzalo, el servicio de reportes ha sido restablecido con exito.',
        esInterno: false,
        creadoEn: new Date(Date.now() - 1200000).toISOString()
      }
    ]
  },
  {
    id: 3,
    codigo: 'TCK-2026-0003',
    solicitanteId: 3,
    solicitante: USUARIOS_DEMO[2],
    tecnicoId: null,
    categoria: 'Hardware',
    prioridad: 'baja',
    estado: 'abierto',
    descripcion: 'Solicitud de cable HDMI y adaptador DisplayPort para sala de reuniones Piso 4.',
    slaLimiteMinutos: 480,
    creadoEn: new Date(Date.now() - 1800000).toISOString(),
    comentarios: []
  }
];

// ==========================================
// 3. AUTENTICACION CON DUAL-MODE
// ==========================================
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data: AuthResponse = await res.json();
      setAuthToken(data.token);
      setStoredUser(data.usuario);
      return data;
    }

    const errData = await res.json().catch(() => ({}));
    if (res.status === 400 || res.status === 401) {
      throw new Error(errData.error || '[ERROR] Credenciales invalidas');
    }
  } catch (err: any) {
    if (err.message && (err.message.includes('Credenciales invalidas') || err.message.includes('Datos de ingreso invalidos'))) {
      throw err;
    }
    // Modo Resiliente / Offline Fallback
    console.warn('[AUTH] Servidor backend no accesible directamente, validando contra catalogo:', err);
  }

  // Fallback local autenticado
  const ident = payload.identificador.toLowerCase().trim();
  const cleanPass = payload.password.trim();

  const userFound = USUARIOS_DEMO.find((u) => {
    const matchEmail = u.email.toLowerCase() === ident;
    const matchRutExact = u.rut.toLowerCase() === ident;
    const matchRutClean = u.rut.replace(/[^0-9kK]/g, '').toLowerCase() === ident.replace(/[^0-9kK]/g, '').toLowerCase();
    return matchEmail || matchRutExact || matchRutClean;
  });

  if (!userFound) {
    throw new Error('[ERROR] Credenciales invalidas: usuario no registrado');
  }

  const expectedPass =
    userFound.rol === 'SUPERVISOR_ADMIN'
      ? 'admin2026'
      : userFound.rol === 'AGENTE_SOPORTE'
      ? 'soporte2026'
      : 'usuario2026';

  if (cleanPass !== expectedPass) {
    throw new Error('[ERROR] Contrasena corporativa incorrecta');
  }

  const demoToken = `mock-token-${userFound.id}-${Date.now()}`;
  setAuthToken(demoToken);
  setStoredUser(userFound);
  return {
    token: demoToken,
    usuario: userFound
  };
}

export async function fetchPerfil(): Promise<UsuarioDTO> {
  try {
    const res = await fetch(`${API_BASE}/auth/perfil`, {
      headers: getHeaders()
    });

    if (res.ok) {
      const u: UsuarioDTO = await res.json();
      setStoredUser(u);
      return u;
    }
  } catch (err) {
    console.warn('[AUTH] Fallback local para perfil en sesion');
  }

  const storedUser = getStoredUser();
  if (storedUser) {
    return storedUser;
  }

  const token = getAuthToken();
  if (token && token.startsWith('mock-token-')) {
    const parts = token.split('-');
    const userId = parseInt(parts[2], 10);
    const user = USUARIOS_DEMO.find((u) => u.id === userId);
    if (user) {
      setStoredUser(user);
      return user;
    }
  }

  // Si tiene un JWT real decodificable
  if (token && token.includes('.')) {
    try {
      const payloadBase64 = token.split('.')[1];
      const decoded = JSON.parse(atob(payloadBase64));
      if (decoded && decoded.id && decoded.rol) {
        const u = decoded as UsuarioDTO;
        setStoredUser(u);
        return u;
      }
    } catch {}
  }

  throw new Error('[ERROR] Sesion no valida o expirada');
}

// ==========================================
// 4. CONSULTAS DE USUARIOS
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
  } catch {}

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
// 5. GESTION DE TICKETS
// ==========================================
export async function fetchMisTickets(): Promise<TicketDTO[]> {
  try {
    const res = await fetch(`${API_BASE}/mis-tickets`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const storedUser = getStoredUser();
  if (storedUser) {
    return TICKETS_MEMORIA.filter((t) => t.solicitanteId === storedUser.id);
  }
  return TICKETS_MEMORIA;
}

export async function fetchTickets(filtros?: {
  estado?: string;
  departamento?: string;
  categoria?: string;
  prioridad?: string;
  busqueda?: string;
}): Promise<TicketDTO[]> {
  try {
    const params = new URLSearchParams();
    if (filtros?.estado && filtros.estado !== 'todos') params.append('estado', filtros.estado);
    if (filtros?.departamento && filtros.departamento !== 'todos') params.append('departamento', filtros.departamento);
    if (filtros?.categoria && filtros.categoria !== 'todos') params.append('categoria', filtros.categoria);
    if (filtros?.prioridad && filtros.prioridad !== 'todos') params.append('prioridad', filtros.prioridad);
    if (filtros?.busqueda) params.append('busqueda', filtros.busqueda);

    const url = `${API_BASE}/tickets${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Filtrado local en memoria
  let list = [...TICKETS_MEMORIA];
  if (filtros?.estado && filtros.estado !== 'todos') {
    list = list.filter((t) => t.estado === filtros.estado);
  }
  if (filtros?.departamento && filtros.departamento !== 'todos') {
    list = list.filter((t) => t.solicitante?.departamento === filtros.departamento);
  }
  if (filtros?.categoria && filtros.categoria !== 'todos') {
    list = list.filter((t) => t.categoria === filtros.categoria);
  }
  if (filtros?.prioridad && filtros.prioridad !== 'todos') {
    list = list.filter((t) => t.prioridad === filtros.prioridad);
  }
  if (filtros?.busqueda && filtros.busqueda.trim()) {
    const q = filtros.busqueda.toLowerCase();
    list = list.filter(
      (t) =>
        t.codigo.toLowerCase().includes(q) ||
        t.descripcion.toLowerCase().includes(q) ||
        t.solicitante?.nombre.toLowerCase().includes(q) ||
        t.solicitante?.rut.includes(q)
    );
  }
  return list;
}

export async function fetchTicketDetalle(id: number): Promise<TicketDTO> {
  try {
    const res = await fetch(`${API_BASE}/tickets/${id}`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const found = TICKETS_MEMORIA.find((t) => t.id === id);
  if (!found) {
    throw new Error(`[ERROR] Ticket ID #${id} no encontrado`);
  }
  return found;
}

export async function crearTicket(data: CrearTicketPayload): Promise<TicketDTO> {
  const formattedRut = data.rut ? formatRut(data.rut) : undefined;

  try {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ...data, rut: formattedRut })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // Creacion en memoria
  const currentUser = getStoredUser() || USUARIOS_DEMO.find((u) => u.rut === formattedRut) || USUARIOS_DEMO[2];
  const newId = TICKETS_MEMORIA.length + 1;
  const seq = newId.toString().padStart(4, '0');

  const nuevo: TicketDTO = {
    id: newId,
    codigo: `TCK-2026-${seq}`,
    solicitanteId: currentUser.id,
    solicitante: currentUser,
    tecnicoId: null,
    categoria: data.categoria,
    prioridad: data.prioridad,
    estado: 'abierto',
    descripcion: data.descripcion,
    ciAfectado: data.ciAfectado || null,
    slaLimiteMinutos: data.prioridad === 'critica' ? 60 : data.prioridad === 'alta' ? 120 : 240,
    creadoEn: new Date().toISOString(),
    comentarios: []
  };

  TICKETS_MEMORIA.unshift(nuevo);
  return nuevo;
}

export async function agregarComentario(
  ticketId: number,
  payload: CrearComentarioPayload
): Promise<ComentarioDTO> {
  try {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/comentarios`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const ticket = TICKETS_MEMORIA.find((t) => t.id === ticketId);
  const currentUser = getStoredUser() || USUARIOS_DEMO[0];

  const nuevoComentario: ComentarioDTO = {
    id: (ticket?.comentarios?.length || 0) + 1,
    ticketId,
    autorId: currentUser.id,
    autor: currentUser,
    contenido: payload.contenido,
    esInterno: payload.esInterno || false,
    creadoEn: new Date().toISOString()
  };

  if (ticket) {
    if (!ticket.comentarios) ticket.comentarios = [];
    ticket.comentarios.push(nuevoComentario);
  }

  return nuevoComentario;
}

export async function actualizarEstadoTicket(
  id: number,
  nuevoEstado: Estado,
  ciAfectado?: string
): Promise<TicketDTO> {
  try {
    const res = await fetch(`${API_BASE}/tickets/${id}/estado`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ estado: nuevoEstado, ciAfectado })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const ticket = TICKETS_MEMORIA.find((t) => t.id === id);
  if (!ticket) throw new Error('[ERROR] Ticket no encontrado');

  ticket.estado = nuevoEstado;
  if (ciAfectado !== undefined) ticket.ciAfectado = ciAfectado;
  if (nuevoEstado === 'resuelto' || nuevoEstado === 'cerrado') {
    ticket.resueltoEn = new Date().toISOString();
  }
  return ticket;
}

export async function asignarTecnicoTicket(
  id: number,
  tecnicoId: number | null
): Promise<TicketDTO> {
  try {
    const res = await fetch(`${API_BASE}/tickets/${id}/asignar`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ tecnicoId })
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const ticket = TICKETS_MEMORIA.find((t) => t.id === id);
  if (!ticket) throw new Error('[ERROR] Ticket no encontrado');

  ticket.tecnicoId = tecnicoId;
  ticket.tecnico = tecnicoId ? USUARIOS_DEMO.find((u) => u.id === tecnicoId) || null : null;
  return ticket;
}

// ==========================================
// 6. METRICAS SLA & ANALITICAS
// ==========================================
export async function fetchMetricasSLA(): Promise<MetricasSLADTO> {
  try {
    const res = await fetch(`${API_BASE}/admin/metricas-sla`, {
      headers: getHeaders()
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const total = TICKETS_MEMORIA.length;
  const abiertos = TICKETS_MEMORIA.filter((t) => t.estado === 'abierto').length;
  const enProceso = TICKETS_MEMORIA.filter((t) => t.estado === 'en_proceso').length;
  const resueltos = TICKETS_MEMORIA.filter((t) => t.estado === 'resuelto').length;
  const cerrados = TICKETS_MEMORIA.filter((t) => t.estado === 'cerrado').length;
  const criticos = TICKETS_MEMORIA.filter((t) => t.prioridad === 'critica' && (t.estado === 'abierto' || t.estado === 'en_proceso')).length;

  return {
    totalTickets: total,
    abiertos,
    enProceso,
    resueltos,
    cerrados,
    criticosActivos: criticos,
    mttrPromedioMinutos: 48,
    cumplimientoSlaPorcentaje: 96,
    distribucionCategorias: [
      { categoria: 'Redes y Conectividad', cantidad: 1 },
      { categoria: 'Software', cantidad: 1 },
      { categoria: 'Hardware', cantidad: 1 }
    ],
    distribucionDepartamentos: [
      { departamento: 'Recursos Humanos (SMU)', cantidad: 2 },
      { departamento: 'Finanzas y Medios de Pago (Unicard)', cantidad: 1 }
    ]
  };
}

// ==========================================
// 7. CMDB & INFERENCIA RCA (FASE 3)
// ==========================================
export async function fetchCatalogoCMDB(filtros?: {
  capa?: string;
  criticidad?: string;
  busqueda?: string;
}): Promise<ElementoCMDB[]> {
  try {
    const params = new URLSearchParams();
    if (filtros?.capa && filtros.capa !== 'todas') params.append('capa', filtros.capa);
    if (filtros?.criticidad && filtros.criticidad !== 'todas') params.append('criticidad', filtros.criticidad);
    if (filtros?.busqueda) params.append('busqueda', filtros.busqueda);

    const url = `${API_BASE}/cmdb/cis${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  let list = [...CATALOGO_CMDB_LOCAL];
  if (filtros?.capa && filtros.capa !== 'todas') {
    list = list.filter((c) => c.capa === filtros.capa);
  }
  if (filtros?.criticidad && filtros.criticidad !== 'todas') {
    list = list.filter((c) => c.criticidad === filtros.criticidad);
  }
  if (filtros?.busqueda && filtros.busqueda.trim()) {
    const q = filtros.busqueda.toLowerCase();
    list = list.filter((c) => c.id.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q));
  }
  return list;
}

export async function fetchCIDetalle(id: string): Promise<ElementoCMDB & { blastRadius: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/cmdb/cis/${encodeURIComponent(id)}`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const ci = CATALOGO_CMDB_LOCAL.find((c) => c.id.toLowerCase() === id.toLowerCase()) || CATALOGO_CMDB_LOCAL[0];
  return {
    ...ci,
    blastRadius: ['CREDITMAKER', 'ERP_SAP_FINANZAS']
  };
}

export async function fetchDiagnosticoRCA(ticketId: number): Promise<SugerenciaRCADTO> {
  try {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}/diagnostico-rca`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  const ticket = TICKETS_MEMORIA.find((t) => t.id === ticketId);
  const matchedCi = ticket?.ciAfectado
    ? CATALOGO_CMDB_LOCAL.find((c) => c.id === ticket.ciAfectado) || CATALOGO_CMDB_LOCAL[4]
    : CATALOGO_CMDB_LOCAL[4];

  return {
    ticketId,
    ciSugerido: matchedCi,
    confianzaPorcentaje: 92,
    blastRadiusNodosAfectados: ['CREDITMAKER', 'PORTAL_AUTOATENCION'],
    motivoDeteccion: `Inferencia heuristica: Correlacion de categoria y terminos tecnicos en topologia ${matchedCi.capa}.`,
    runbookMitigacion: matchedCi.runbookSugerido || 'RB-NET-008: Procedimiento de reinicio seguro de demonio Keepalived/HAProxy'
  };
}

export async function fetchCorrelacionIncidentes(): Promise<CorrelacionIncidentesDTO[]> {
  try {
    const res = await fetch(`${API_BASE}/operaciones/correlacion-masiva`, {
      headers: getHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return [
    {
      ciId: 'BALANCER001',
      ciNombre: 'HAProxy / NGINX Ingress Balancer 01',
      capa: 'L3_MIDDLEWARE',
      totalTicketsAsociados: 1,
      ticketsIds: [1],
      codigosTickets: ['TCK-2026-0001'],
      alertaMasiva: false,
      descripcionImpacto: 'Monitoreo normal: 1 ticket asociado a servicios de balanceo.'
    },
    {
      ciId: 'PRODMIDWARE003',
      ciNombre: 'WSO2 Enterprise Integrator / API Gateway',
      capa: 'L3_MIDDLEWARE',
      totalTicketsAsociados: 1,
      ticketsIds: [2],
      codigosTickets: ['TCK-2026-0002'],
      alertaMasiva: false,
      descripcionImpacto: 'Monitoreo normal: 1 ticket resuelto.'
    }
  ];
}




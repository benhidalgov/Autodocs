import { ElementoCMDB, SugerenciaRCADTO, CorrelacionIncidentesDTO } from '../../shared/types';

export const CATALOGO_CMDB: ElementoCMDB[] = [
  // Capa L1: Hardware
  {
    id: 'HPE_Synergy',
    nombre: 'HPE Synergy 12000 Frame',
    capa: 'L1_HARDWARE',
    criticidad: 'CRITICA',
    ip: '10.24.0.10',
    ambiente: 'PRODUCCION',
    descripcion: 'Chasis modular blade principal que aloja el computo de produccion Unicard y SMU.',
    palabrasClave: ['chasis', 'hardware', 'synergy', 'fuente', 'ventilador', 'blade', 'bahia', 'fibra'],
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
    palabrasClave: ['almacenamiento', 'storage', 'san', 'nvme', 'iops', 'lun', 'purestorage', 'disco', 'volumen'],
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
    palabrasClave: ['firewall', 'red', 'seguridad', 'fortigate', 'vpn', 'bloqueo', 'puerto', 'enrutamiento', 'radius'],
    dependencias: [],
    runbookSugerido: 'RB-SEC-002: Verificacion de politicas y reglas de firewall perimetral'
  },

  // Capa L2: Virtualizacion y Computo
  {
    id: 'ClusterBL',
    nombre: 'VMware vSphere Cluster Blades (ESXi 8.0)',
    capa: 'L2_VIRTUALIZACION',
    criticidad: 'CRITICA',
    ip: '10.24.0.50',
    ambiente: 'PRODUCCION',
    descripcion: 'Cluster de virtualizacion para cargas de trabajo Linux y contenedores.',
    palabrasClave: ['cluster', 'esxi', 'vmware', 'vcenter', 'migracion', 'vswitch', 'hipervisor', 'ram'],
    dependencias: ['HPE_Synergy', 'SAN_PureStorage'],
    runbookSugerido: 'RB-VIRT-003: Balanceo de carga y remediacion DRS en ESXi'
  },
  {
    id: 'ClusterMS',
    nombre: 'Hyper-V Enterprise Windows Cluster',
    capa: 'L2_VIRTUALIZACION',
    criticidad: 'ALTA',
    ip: '10.24.0.60',
    ambiente: 'PRODUCCION',
    descripcion: 'Plataforma de virtualizacion para servidores Windows y servicios legados.',
    palabrasClave: ['hyper-v', 'windows', 'cluster', 'ad', 'dominio', 'failover'],
    dependencias: ['HPE_Synergy', 'SAN_PureStorage'],
    runbookSugerido: 'RB-VIRT-005: Diagnostico de cluster failover Hyper-V'
  },
  {
    id: 'K8S_PROD_CLUSTER',
    nombre: 'Kubernetes Production Cluster (RKE2)',
    capa: 'L2_VIRTUALIZACION',
    criticidad: 'CRITICA',
    ip: '10.24.1.100',
    ambiente: 'PRODUCCION',
    descripcion: 'Cluster de microservicios y APIs transaccionales contenerizadas.',
    palabrasClave: ['kubernetes', 'k8s', 'pod', 'ingress', 'namespace', 'contenedor', 'helm', 'daemonset'],
    dependencias: ['ClusterBL'],
    runbookSugerido: 'RB-K8S-010: Remediacion de pods en CrashLoopBackOff'
  },

  // Capa L3: Middleware y Red
  {
    id: 'BALANCER001',
    nombre: 'HAProxy / NGINX Ingress Balancer 01',
    capa: 'L3_MIDDLEWARE',
    criticidad: 'CRITICA',
    ip: '10.24.0.125',
    ambiente: 'PRODUCCION',
    descripcion: 'Balanceador de carga primario para distribucion de trafico transaccional.',
    palabrasClave: ['balancer', 'balanceador', 'haproxy', '502', '503', '504', 'keepalived', 'timeout', 'ssl', 'certificado', 'vpn'],
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
    palabrasClave: ['middleware', 'wso2', 'gateway', 'integracion', 'api', 'synapse', 'hilos', 'facturacion', 'timeout', 'esb'],
    dependencias: ['ClusterBL', 'BALANCER001'],
    runbookSugerido: 'RB-MID-002: Desahogo de pool de conexiones y reinicio ordenado WSO2'
  },
  {
    id: 'RABBITMQ_CORE',
    nombre: 'RabbitMQ Transaccional Cluster',
    capa: 'L3_MIDDLEWARE',
    criticidad: 'ALTA',
    ip: '10.24.2.40',
    ambiente: 'PRODUCCION',
    descripcion: 'Colas de mensajeria y eventos para pagos y notificaciones.',
    palabrasClave: ['rabbitmq', 'cola', 'broker', 'mensajes', 'ack', 'pagos', 'eventos', 'bloqueo'],
    dependencias: ['ClusterBL'],
    runbookSugerido: 'RB-MQ-001: Purgado y restablecimiento de colas bloqueadas'
  },

  // Capa L4: Aplicaciones y Bases de Datos
  {
    id: 'CREDITMAKER',
    nombre: 'CreditMaker - Core Tablet Venta y Emision',
    capa: 'L4_APLICACION',
    criticidad: 'CRITICA',
    ip: '10.24.3.10',
    ambiente: 'PRODUCCION',
    descripcion: 'Aplicacion core de originacion y venta de tarjetas de credito Unicard en sucursales.',
    palabrasClave: ['creditmaker', 'tablet', 'venta', 'tarjeta', 'unicard', 'emision', 'sucursal', 'contrato', 'solicitud'],
    dependencias: ['PRODMIDWARE003', 'ENGAGE_SQL_1', 'BALANCER001'],
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
    palabrasClave: ['sql', 'base de datos', 'database', 'deadlock', 'bloqueo', 'engage', 'query', 'tabla', 'timeout', 'transaccion'],
    dependencias: ['SAN_PureStorage', 'ClusterMS'],
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
    palabrasClave: ['portal', 'web', 'autoservicio', 'login', 'clave', 'sesion', 'cliente', 'frontend'],
    dependencias: ['BALANCER001', 'K8S_PROD_CLUSTER', 'ENGAGE_SQL_1'],
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
    palabrasClave: ['erp', 'sap', 'finanzas', 'facturacion', 'contabilidad', 'proveedor', 'asiento', 'reporte'],
    dependencias: ['PRODMIDWARE003', 'SAN_PureStorage', 'ClusterBL'],
    runbookSugerido: 'RB-ERP-009: Reinicio de instancias de aplicacion SAP Dispatcher'
  }
];

// Helper para calcular Blast Radius (Nodos dependientes recursivamente)
export function calcularBlastRadius(ciId: string): string[] {
  const afectados = new Set<string>();

  function recorrer(actualId: string) {
    for (const ci of CATALOGO_CMDB) {
      if (ci.dependencias && ci.dependencias.includes(actualId)) {
        if (!afectados.has(ci.id)) {
          afectados.add(ci.id);
          recorrer(ci.id);
        }
      }
    }
  }

  recorrer(ciId);
  return Array.from(afectados);
}

// Motor de Inferencia de Causa Raiz (Heuristica de Pesos y Matching Lexico)
export function sugerirCausaRaizTicket(ticket: {
  id: number;
  categoria: string;
  descripcion: string;
  ciAfectado?: string | null;
}): SugerenciaRCADTO {
  const texto = `${ticket.categoria} ${ticket.descripcion}`.toLowerCase();

  // Si ya tiene CI tipificado manualmente
  if (ticket.ciAfectado) {
    const ciExistente = CATALOGO_CMDB.find((c) => c.id === ticket.ciAfectado);
    if (ciExistente) {
      const blastRadius = calcularBlastRadius(ciExistente.id);
      return {
        ticketId: ticket.id,
        ciSugerido: ciExistente,
        confianzaPorcentaje: 98,
        blastRadiusNodosAfectados: blastRadius,
        motivoDeteccion: `CI ${ciExistente.id} (${ciExistente.nombre}) validado directamente en la topologia CMDB.`,
        runbookMitigacion: ciExistente.runbookSugerido || 'RB-GEN-001: Protocolo de soporte estandar'
      };
    }
  }

  // Scoring por coincidencias en palabras clave
  let mejorMatch = CATALOGO_CMDB[0];
  let maxScore = 0;
  let matchesEncontrados: string[] = [];

  for (const ci of CATALOGO_CMDB) {
    let score = 0;
    const matchedTokens: string[] = [];

    // Match en ID o Nombre
    if (texto.includes(ci.id.toLowerCase())) {
      score += 50;
      matchedTokens.push(ci.id);
    }
    if (texto.includes(ci.nombre.toLowerCase())) {
      score += 40;
      matchedTokens.push(ci.nombre);
    }

    // Match en palabras clave
    if (ci.palabrasClave) {
      for (const kw of ci.palabrasClave) {
        if (texto.includes(kw.toLowerCase())) {
          score += 15;
          matchedTokens.push(kw);
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      mejorMatch = ci;
      matchesEncontrados = matchedTokens;
    }
  }

  // Normalizar confianza entre 55% y 95%
  const confianza = Math.min(95, Math.max(55, 50 + maxScore * 2));
  const blastRadius = calcularBlastRadius(mejorMatch.id);

  const motivo =
    matchesEncontrados.length > 0
      ? `Correlacion lexica con terminos tecnicos: [${matchesEncontrados.slice(0, 4).join(', ')}] en capa ${mejorMatch.capa}.`
      : `Asignacion heuristica basada en categoria '${ticket.categoria}'.`;

  return {
    ticketId: ticket.id,
    ciSugerido: mejorMatch,
    confianzaPorcentaje: confianza,
    blastRadiusNodosAfectados: blastRadius,
    motivoDeteccion: motivo,
    runbookMitigacion: mejorMatch.runbookSugerido || 'RB-GEN-001: Protocolo de soporte estandar'
  };
}

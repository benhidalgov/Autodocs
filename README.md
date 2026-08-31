# Sistema de Tickets de Soporte y Autoservicio

Plataforma corporativa full-stack de mesa de ayuda, atencion a usuarios con validacion de RUT chileno (Modulo 11), control de acceso basado en roles (RBAC), gestion de ciclo de vida de tickets con acuerdos de nivel de servicio (SLA/MTTR), integracion con catalogo de configuracion (CMDB), motor de deduccion de causa raiz (RCA) y deteccion automatizada de incidentes masivos.

---

## 1. Arquitectura y Capacidades Principales

* **Autenticacion y Control de Acceso (RBAC):**
  * Seguridad perimetral con tokens **JWT (HMAC-SHA256)** y contraseñas cifradas con **bcrypt** (salt 10).
  * Tres niveles de privilegios:
    * `[SUPERVISOR_ADMIN]`: Gestion total de la plataforma, triaje multinivel, panel SLA y asignacion de tecnicos.
    * `[AGENTE_SOPORTE]`: Atencion de bandeja de entrada, publicacion de notas tecnicas internas y transicion de estados.
    * `[SOLICITANTE]`: Portal de autoservicio con seguimiento exclusivo de sus solicitudes personales.

* **Validacion Algoritmica de RUT Chileno (Modulo 11):**
  * Validacion estricta en frontend y backend del digito verificador (ponderadores 2 al 7 con formula $11 - (\sum d_i \cdot p_i \pmod{11})$).
  * Autocompletado de datos del solicitante y formato normalizado `XX.XXX.XXX-X`.

* **Ficha de Trazabilidad y Conversacion:**
  * Historial cronologico inmutable de actualizaciones.
  * Segregacion de visibilidad: respuestas publicas para el solicitante versus **`[NOTA INTERNA SOPORTE]`** protegidas exclusivas para el equipo tecnico.

* **Integracion con Topologia de Infraestructura (CMDB):**
  * Catalogo de Elementos de Configuracion (CIs) clasificados en cuatro capas:
    * **Capa L1 - Hardware:** Chasis Blade Synergy, Cabinas FlashArray NVMe, Firewalls FortiGate.
    * **Capa L2 - Virtualizacion:** Clusters VMware ESXi, Hyper-V y Kubernetes RKE2.
    * **Capa L3 - Middleware & Red:** Balanceadores HAProxy/NGINX Ingress, Gateway WSO2, Brokers RabbitMQ.
    * **Capa L4 - Aplicaciones & BD:** CreditMaker (Core Venta), SQL Server 2012, ERP SAP Finanzas.

* **Motor de Inferencia Heuristica de Causa Raiz (RCA) & Blast Radius:**
  * Deduccion automatica del CI afectado mas probable con porcentaje de confianza segun patrones lexicos del ticket.
  * Calculo recursivo del **Blast Radius** (arbol de dependencias aguas arriba que se verian degradadas).
  * Recomendacion contextual de Runbooks corporativos de mitigacion.

* **Matriz de Correlacion y Deteccion de Incidentes Masivos:**
  * Agrupacion concurrente en tiempo real de tickets que convergen en el mismo componente de infraestructura.
  * Emision inmediata de la bandera **`[ALERTA MASIVA]`** cuando multiples solicitudes apuntan a un punto unico de falla.

* **Dashboard de Telemetria SLA & MTTR:**
  * Indicadores de porcentaje de cumplimiento de SLA, tiempo medio de reparacion (MTTR promedio en minutos), conteo de incidentes criticos activos y distribucion por gerencia y categoria.

---

## 2. Estructura del Proyecto

```text
C:\Autoservicio\
├── package.json                         # Orquestador del workspace (scripts concurrentes)
├── README.md                            # Manual tecnico y de operaciones
├── shared/                              # Codigo y tipos compartidos
│   ├── rut.ts                           # Algoritmo canonico Modulo 11 y formateador
│   └── types.ts                         # Interfaces TypeScript (DTOs, Roles, Estados, CMDB)
├── backend/                             # API REST (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma                # Esquema relacional de base de datos (SQLite)
│   │   ├── dev.db                       # Base de datos local
│   │   └── seed.ts                      # Poblador con usuarios corporativos y tickets demo
│   ├── src/
│   │   ├── index.ts                     # Servidor Express, rutas y logica analitica
│   │   ├── cmdbData.ts                  # Catalogo CMDB, Blast Radius y motor RCA
│   │   └── middlewares/
│   │       └── auth.ts                  # Middleware de validacion JWT y compuertas RBAC
│   ├── tsconfig.json
│   └── package.json
└── frontend/                            # Interfaz SPA (React + TypeScript + Vite + Tailwind)
    ├── src/
    │   ├── App.tsx                      # Layout principal y navegacion adaptativa por rol
    │   ├── main.tsx                     # Punto de entrada React
    │   ├── context/
    │   │   └── AuthContext.tsx          # Proveedor global de autenticacion y RBAC
    │   ├── services/
    │   │   └── api.ts                   # Cliente HTTP REST con soporte resiliente dual-mode
    │   ├── components/
    │   │   ├── LoginView.tsx            # Pantalla de acceso corporativo con botones demo
    │   │   ├── MisTickets.tsx           # Bandeja del solicitante
    │   │   ├── ListaTickets.tsx         # Consola de triaje general de tickets
    │   │   ├── CrearTicket.tsx          # Formulario con validacion de RUT y selector CMDB
    │   │   ├── ModalDetalleTicket.tsx   # Ficha de atencion, notas internas y panel RCA
    │   │   └── DashboardSLA.tsx         # Dashboard de KPIs, SLA, MTTR y correlacion CMDB
    │   └── hooks/
    │       └── useDebounce.ts           # Hook para debounce de validacion de RUT
    ├── vite.config.ts                   # Configuracion de Vite con proxy hacia backend
    ├── tailwind.config.js
    └── package.json
```

---

## 3. Instalacion y Puesta en Marcha

### Requisitos Previos
* Node.js (version 18 o superior LTS)
* npm (version 9 o superior)

### Paso 1: Instalar dependencias
Desde la carpeta raiz `C:\Autoservicio`:
```bash
npm run install:all
```

### Paso 2: Generar y Poblar la Base de Datos SQLite
```bash
npm run db:generate
npm run db:seed
```

### Paso 3: Iniciar la Plataforma Completa
Para ejecutar simultaneamente el **Backend (puerto 3001)** y el **Frontend (puerto 5173)** con un solo comando:
```bash
npm run dev
```

* **Frontend Web:** `http://localhost:5173`
* **Backend API REST:** `http://localhost:3001/api`
* **Health Check:** `http://localhost:3001/api/health`

---

## 4. Matriz de Cuentas y Credenciales Corporativas

El sistema incluye cuentas de prueba preconfiguradas con contraseñas cifradas en base de datos:

| Nombre de Usuario | Identificador (RUT / Email) | Contraseña | Rol Asignado | Gerencia / Departamento |
| :--- | :--- | :--- | :--- | :--- |
| **Pablo Administrador** | `pablo@unicard.cl` &bull; `11222333-9` | `admin2026` | `[SUPERVISOR_ADMIN]` | Infraestructura y Redes (SMU / Unicard) |
| **Valentina Paz Rojas** | `soporte@smu.cl` &bull; `15678912-7` | `soporte2026` | `[AGENTE_SOPORTE]` | Mesa de Ayuda y Operaciones TI |
| **Ana Maria Silva** | `ana.silva@smu.cl` &bull; `12345678-5` | `usuario2026` | `[SOLICITANTE]` | Recursos Humanos (SMU) |
| **Gonzalo Andres Pinto** | `gonzalo.pinto@unicard.cl` &bull; `18765432-7` | `usuario2026` | `[SOLICITANTE]` | Finanzas y Medios de Pago (Unicard) |
| **Camila Ignacia Carrasco**| `camila.carrasco@smu.cl` &bull; `20123456-5` | `usuario2026` | `[SOLICITANTE]` | Comercial y Marketing (SMU) |

*(En la pantalla de acceso corporativo se dispone de botones de autocompletado rapido para ingresar directamente con un solo clic).*

---

## 5. Especificacion de la API REST

### Autenticacion y Sesion
* `POST /api/auth/login`: Autenticacion por RUT o Email + Contraseña. Retorna token JWT y perfil.
* `GET /api/auth/perfil`: Consulta del perfil del usuario en sesion (requiere encabezado Bearer).

### Gestion de Tickets
* `GET /api/mis-tickets`: Listado de solicitudes del colaborador autenticado (excluye notas internas).
* `GET /api/tickets`: Bandeja general de soporte con filtros por `estado`, `departamento`, `categoria`, `prioridad` y `busqueda`.
* `GET /api/tickets/:id`: Ficha detallada del ticket con historial de comentarios.
* `POST /api/tickets`: Creacion de ticket vinculando SLA dinamico segun prioridad (Critica: 60m, Alta: 120m, Media: 240m, Baja: 480m).
* `POST /api/tickets/:id/comentarios`: Publicacion de comentario (soporta bandera `esInterno: true` para staff).
* `PATCH /api/tickets/:id/estado`: Transicion de estado (`abierto`, `en_proceso`, `pendiente_usuario`, `resuelto`, `cerrado`) y vinculacion de `ciAfectado`.
* `PATCH /api/tickets/:id/asignar`: Asignacion de tecnico responsable.

### Analitica, CMDB y Diagnostico
* `GET /api/admin/metricas-sla`: Telemetria de MTTR, % de cumplimiento de SLA y distribuciones.
* `GET /api/cmdb/cis`: Catalogo de CIs filtrable por capa (L1-L4) y criticidad.
* `GET /api/cmdb/cis/:id`: Ficha tecnica del CI con calculo de Blast Radius.
* `GET /api/tickets/:id/diagnostico-rca`: Inferencia automatica de causa raiz y recomendacion de Runbook.
* `GET /api/operaciones/correlacion-masiva`: Agrupador reactivo de incidentes masivos por componente.

---

## 6. Stack Tecnologico

| Componente | Tecnologia | Proposito |
| :--- | :--- | :--- |
| **Backend Runtime** | Node.js + TypeScript + tsx | Motor de API REST tipado y de alto desempeno |
| **Framework HTTP** | Express 4.x + CORS | Enrutamiento modular y manejo de peticiones |
| **ORM & Base de Datos** | Prisma 5.x + SQLite | Modelo de datos relacional e inmutable |
| **Seguridad Criptografica**| jsonwebtoken (JWT) + bcryptjs | Tokens de sesion y cifrado irreversible de contraseñas |
| **Validacion de Esquemas** | Zod 3.x | Validacion declarativa de payloads y contratos |
| **Frontend Framework** | React 18 + TypeScript | Interfaz de usuario declarativa por componentes |
| **Bundler & Dev Server** | Vite 6.x | Compilacion instantanea y Hot Module Replacement |
| **Estilos Corporativos** | Tailwind CSS (Paleta Obsidian & Indigo)| Diseno sobrio, institucional y Theme-Safe |
| **Iconografia Tecnica** | Lucide React | Iconos vectoriales limpios (estrictamente sin emojis) |
| **Formularios** | React Hook Form + Hookform Resolvers | Manejo eficiente de formularios sin re-renders innecesarios |

---

## 7. Integracion con la Boveda de Conocimiento

Este modulo opera en sincronia con los estandares definidos en la boveda de arquitectura:
* **[[Tickets]]**: Modelado matematico, especificacion de red neuronal y formalizacion tensorial.
* **[[CMDB]]**: Topologia relacional de CIs en capas L1 a L4 y referencias AQL (Atlassian Assets).
* **[[Red_Neuronal_Incidentes_y_RCA]]**: Matriz de pesos sinapticos para inferencia de causa raiz.
* **[[Grafo_Maestro_de_Operaciones]]**: MOC central que interconecta la telemetria con los Runbooks de recuperacion.

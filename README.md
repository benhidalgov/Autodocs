# Sistema de Tickets de Soporte (Full-Stack)

Sistema integral de gestión de tickets de soporte técnico con arquitectura full-stack, validación de RUT chileno (Módulo 11) compartida entre frontend y backend, autocompletado en tiempo real con debounce, base de datos SQLite administrada con Prisma ORM y diseño moderno con Tailwind CSS.

---

## 📁 Arquitectura del Proyecto

El proyecto está organizado en tres carpetas independientes y modulares:

```
/Prototipo ayuda
├── /backend            # API REST con Node.js, Express, TypeScript, Prisma y SQLite
│   ├── /prisma
│   │   ├── schema.prisma   # Modelos Usuario y Ticket
│   │   └── seed.ts         # Precarga de 5 usuarios con RUT válidos y tickets de ejemplo
│   ├── /src
│   │   └── index.ts        # Endpoints Express, validación con Zod y Módulo 11
│   ├── package.json
│   └── tsconfig.json
│
├── /frontend           # SPA en React + Vite + TypeScript + Tailwind CSS
│   ├── /src
│   │   ├── /components
│   │   │   ├── CrearTicket.tsx   # Formulario con debounce 400ms, autocompletado y bloqueo
│   │   │   └── ListaTickets.tsx  # Tabla reactiva, filtros de estado/departamento y actualización
│   │   ├── /hooks
│   │   │   └── useDebounce.ts    # Hook reutilizable de debounce
│   │   ├── /services
│   │   │   └── api.ts            # Cliente HTTP para comunicación con el backend
│   │   ├── App.tsx               # Navegación entre vistas por estado de React
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── /shared             # Código y tipos TypeScript compartidos
│   ├── rut.ts          # Algoritmo Módulo 11 (validación, limpieza y normalización)
│   └── types.ts        # Interfaces y tipos DTO compartidos (Usuario, Ticket, Estados)
│
├── package.json        # Script centralizado para orquestar backend y frontend en paralelo
└── README.md           # Documentación e instrucciones de ejecución local
```

---

## 🛠️ Stack Tecnológico

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Hook Form, Zod, Lucide React.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite (archivo local `dev.db`), Zod.
- **Shared**: Validación de RUT chileno con algoritmo de **Módulo 11** (`/shared/rut.ts`) consumida por cliente y servidor.

---

## 👥 Usuarios de Prueba Precargados (Seed)

La base de datos se inicializa con 5 usuarios con RUT chileno matemáticamente válidos:

| RUT | Nombre Completo | Departamento | Email |
| :--- | :--- | :--- | :--- |
| `12345678-5` | Ana María Silva Castro | Recursos Humanos | ana.silva@empresa.cl |
| `11222333-9` | Carlos Eduardo Mendoza Morales | Tecnología y Sistemas | carlos.mendoza@empresa.cl |
| `15678912-7` | Valentina Paz Rojas Vega | Operaciones y Logística | valentina.rojas@empresa.cl |
| `18765432-7` | Gonzalo Andrés Pinto Flores | Finanzas y Contabilidad | gonzalo.pinto@empresa.cl |
| `20123456-5` | Camila Ignacia Carrasco Baeza | Comercial y Marketing | camila.carrasco@empresa.cl |

> En la pantalla de **Crear Ticket** hay botones de acceso rápido para probar inmediatamente con estos RUTs.

---

## 🚀 Instrucciones para Correr el Proyecto Localmente

### Requisitos Previos
- **Node.js** v18 o superior instalado.
- **npm** v9 o superior.

> **Nota para Windows (PowerShell)**: Si PowerShell bloquea la ejecución de scripts (`npm.ps1`), ejecuta los comandos a través de `cmd.exe` o ejecutando una vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

---

### Opción 1: Todo en un solo paso (Recomendado)

Desde la raíz del proyecto (`C:\Prototipo ayuda`):

#### 1. Instalar dependencias
```bash
npm run install:all
```
*(O manualmente entrando a `/backend` y `/frontend` y corriendo `npm install`)*

#### 2. Generar base de datos SQLite y poblar datos de prueba (Seed)
```bash
npm run db:migrate
```
*(Este comando genera la base de datos `backend/dev.db`, crea las tablas y corre automáticamente el seed con los 5 usuarios)*.

Si en cualquier momento deseas re-ejecutar el seed:
```bash
npm run db:seed
```

#### 3. Levantar Frontend y Backend en paralelo
```bash
npm run dev
```

Esto iniciará:
- **Backend API**: `http://localhost:3001`
- **Frontend Vite**: `http://localhost:5173` (con proxy automático hacia `/api`)

Abre tu navegador en: 👉 **`http://localhost:5173`**

---

### Opción 2: Ejecución en terminales separadas

Si prefieres tener dos terminales abiertas:

#### Terminal 1 - Backend:
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```
*El servidor backend quedará escuchando en `http://localhost:3001`.*

#### Terminal 2 - Frontend:
```bash
cd frontend
npm install
npm run dev
```
*El frontend estará disponible en `http://localhost:5173`.*

---

## 📡 Endpoints del Backend

Todos los endpoints aplican validaciones estrictas en el servidor:

| Método | Endpoint | Descripción | Validaciones Clave |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/usuarios/:rut` | Devuelve nombre, departamento e email si el usuario existe. | Revalida el RUT con algoritmo Módulo 11. Devuelve 400 si es inválido, 404 si no existe. |
| `POST` | `/api/tickets` | Crea un nuevo ticket correlativo (ej. `TCK-2026-0001`). | Revalida el RUT y todos los campos obligatorios con **Zod** y **Módulo 11**. Verifica existencia de usuario. |
| `GET` | `/api/tickets` | Retorna todos los tickets con información de su usuario solicitante. | Ordenados descendentemente por fecha (`creadoEn: 'desc'`). |
| `PATCH` | `/api/tickets/:id/estado` | Actualiza el estado de un ticket (`abierto`, `en_proceso`, `resuelto`, `cerrado`). | Valida que el estado pertenezca al enum permitido y actualiza en SQLite. |
| `GET` | `/api/health` | Chequeo de salud del servicio backend. | Estado operativo y hora del servidor. |

---

## ✨ Características y Flujos Frontend

1. **Pantalla "Crear ticket"**:
   - **Campo RUT con Debounce (400ms)**: Al escribir, espera 400ms tras la última tecla pulsada para no saturar la red.
   - **Validación Módulo 11**: Si el dígito verificador no coincide con la fórmula matemática, se informa de inmediato.
   - **Consulta y Autocompletado**: Al ser un RUT válido, consulta `GET /api/usuarios/:rut` y rellena los campos **Nombre** y **Departamento** (en modo de solo lectura/deshabilitados).
   - **Bloqueo Inteligente**: Si el RUT no existe en la base de datos, muestra una alerta explicativa y mantiene deshabilitado el botón de creación.
   - **Categorías y Prioridades**: Selección de tipo de incidente y nivel de impacto (`baja`, `media`, `alta`, `critica`).
   - Al registrar con éxito, muestra mensaje de confirmación y redirige a la lista para ver el ticket en vivo.

2. **Pantalla "Tickets"**:
   - **Tabla reactiva**: Visualización completa con badges de prioridad y estado con código de color.
   - **Filtro por Estado**: Filtrar instantáneamente entre todos, abiertos, en proceso, resueltos o cerrados.
   - **Filtro por Departamento**: Detecta dinámicamente los departamentos existentes y permite filtrar.
   - **Buscador en tiempo real**: Búsqueda por texto en código del ticket, nombre del solicitante o descripción.
   - **Cambio de Estado en Vivo**: Cada fila cuenta con un selector para cambiar el estado a cualquier valor en un clic, impactando inmediatamente la base de datos sin recargar la página.

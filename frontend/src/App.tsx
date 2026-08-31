import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/LoginView';
import { CrearTicket } from './components/CrearTicket';
import { ListaTickets } from './components/ListaTickets';
import { MisTickets } from './components/MisTickets';
import { DashboardSLA } from './components/DashboardSLA';
import { ModalDetalleTicket } from './components/ModalDetalleTicket';
import {
  ShieldCheck,
  PlusCircle,
  ListOrdered,
  Layers,
  LogOut,
  TrendingUp,
  User,
  Loader2
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { usuario, isLoading, logout, isStaff, isSolicitante } = useAuth();
  const [tabActual, setTabActual] = useState<string>('default');
  const [ticketCounter, setTicketCounter] = useState(0);
  const [ticketSeleccionadoId, setTicketSeleccionadoId] = useState<number | null>(null);

  // Determinar tab inicial segun rol
  const tabEfectivo =
    tabActual === 'default'
      ? isSolicitante
        ? 'mis-tickets'
        : 'lista'
      : tabActual;

  const handleTicketCreado = () => {
    setTicketCounter((prev) => prev + 1);
    setTabActual(isSolicitante ? 'mis-tickets' : 'lista');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-xs font-mono text-slate-400">Verificando sesion corporativa...</span>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <LoginView />
        <footer className="py-4 text-center text-xs text-slate-500 font-mono">
          Consola de Operaciones &bull; Control de Acceso RBAC &bull; Modulo 11
        </footer>
      </div>
    );
  }

  const getRolBadge = () => {
    switch (usuario.rol) {
      case 'SUPERVISOR_ADMIN':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      case 'AGENTE_SOPORTE':
        return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
      case 'SOLICITANTE':
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Barra Superior Corporativa */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Identidad */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/40">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100 leading-tight">
                  Mesa de Ayuda &bull; Operaciones
                </h1>
                <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <span>[RUT-MODULO-11]</span> &bull; <span>[AES-JWT]</span>
                </p>
              </div>
            </div>

            {/* Informacion de Usuario y Boton de Cierre */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <div className="w-7 h-7 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center justify-center">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-200 leading-none">
                    {usuario.nombre}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {usuario.departamento}
                  </div>
                </div>
                <span className={`ml-1 px-2 py-0.5 text-[10px] rounded font-mono border ${getRolBadge()}`}>
                  [{usuario.rol}]
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Cerrar sesion"
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition flex items-center gap-1.5 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Cerrar Sesion</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-barra de Pestañas Segregadas por Rol */}
        <div className="bg-slate-950 px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto flex items-center gap-1 py-1.5 overflow-x-auto">
            {/* Vistas para Solicitante */}
            {isSolicitante && (
              <>
                <button
                  type="button"
                  onClick={() => setTabActual('mis-tickets')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    tabEfectivo === 'mis-tickets'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Mis Solicitudes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTabActual('crear')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    tabEfectivo === 'crear'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Nuevo Requerimiento</span>
                </button>
              </>
            )}

            {/* Vistas para Soporte y Administrador */}
            {isStaff && (
              <>
                <button
                  type="button"
                  onClick={() => setTabActual('lista')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    tabEfectivo === 'lista'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Bandeja de Triaje (Todos)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTabActual('dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    tabEfectivo === 'dashboard'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Dashboard SLA & Telemetria</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTabActual('crear')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    tabEfectivo === 'crear'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Crear Ticket</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tabEfectivo === 'crear' && (
          <CrearTicket onTicketCreado={handleTicketCreado} />
        )}

        {tabEfectivo === 'mis-tickets' && (
          <MisTickets
            onNuevoTicketClick={() => setTabActual('crear')}
            onSeleccionarTicket={(id) => setTicketSeleccionadoId(id)}
          />
        )}

        {tabEfectivo === 'lista' && (
          <ListaTickets
            key={ticketCounter}
            onNuevoTicketClick={() => setTabActual('crear')}
            onSeleccionarTicket={(id) => setTicketSeleccionadoId(id)}
          />
        )}

        {tabEfectivo === 'dashboard' && <DashboardSLA />}
      </main>

      {/* Modal de Detalle de Ticket */}
      {ticketSeleccionadoId !== null && (
        <ModalDetalleTicket
          ticketId={ticketSeleccionadoId}
          onClose={() => setTicketSeleccionadoId(null)}
          onTicketUpdated={() => setTicketCounter((c) => c + 1)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 font-mono">
        <p>Sistema de Tickets de Soporte &bull; React + Express + Prisma + SQLite &bull; Gobernanza RBAC</p>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;


import React, { useState } from 'react';
import { CrearTicket } from './components/CrearTicket';
import { ListaTickets } from './components/ListaTickets';
import { TicketCheck, PlusCircle, ListOrdered, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [tabActual, setTabActual] = useState<'crear' | 'lista'>('crear');
  const [ticketCounter, setTicketCounter] = useState(0);

  const handleTicketCreado = () => {
    // Incrementamos el contador para que la lista refresque si cambia de pestaña
    setTicketCounter((prev) => prev + 1);
    // Cambiamos automáticamente a la vista de tickets para ver el ticket recién creado
    setTabActual('lista');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Barra de Navegación Superior */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo y Marca */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/30">
                <TicketCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  Mesa de Ayuda &bull; Soporte
                </h1>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Validación Módulo 11 (Chile)
                </p>
              </div>
            </div>

            {/* Pestañas de Navegación (Estado simple de React, sin router externo) */}
            <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setTabActual('crear')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  tabActual === 'crear'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Crear Ticket</span>
              </button>

              <button
                type="button"
                onClick={() => setTabActual('lista')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  tabActual === 'lista'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span>Tickets Registrados</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Contenido Principal según Pestaña Activa */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {tabActual === 'crear' ? (
          <CrearTicket onTicketCreado={handleTicketCreado} />
        ) : (
          <ListaTickets
            key={ticketCounter}
            onNuevoTicketClick={() => setTabActual('crear')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p>Sistema de Tickets de Soporte &bull; React + Vite + Tailwind + Express + Prisma + SQLite &bull; RUT Módulo 11</p>
      </footer>
    </div>
  );
};

export default App;

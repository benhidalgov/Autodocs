import React, { useState, useEffect } from 'react';
import { TicketDTO, Estado, Prioridad } from '@shared/types';
import { fetchMisTickets } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  RotateCw,
  PlusCircle,
  Tag,
  Calendar,
  UserCheck,
  Loader2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

interface MisTicketsProps {
  onNuevoTicketClick: () => void;
  onSeleccionarTicket: (ticketId: number) => void;
}

export const MisTickets: React.FC<MisTicketsProps> = ({
  onNuevoTicketClick,
  onSeleccionarTicket
}) => {
  const { usuario } = useAuth();
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarMisTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMisTickets();
      setTickets(data);
    } catch (err: any) {
      setError(err.message || '[ERROR] Error al cargar mis requerimientos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMisTickets();
  }, []);

  const getEstadoBadge = (estado: Estado) => {
    switch (estado) {
      case 'abierto':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'en_proceso':
        return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold';
      case 'pendiente_usuario':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      case 'resuelto':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      case 'cerrado':
        return 'bg-slate-200 text-slate-800 border-slate-300 font-bold';
    }
  };

  const getPrioridadBadge = (prioridad: Prioridad) => {
    switch (prioridad) {
      case 'critica':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'alta':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'media':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'baja':
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            Mis Solicitudes y Requerimientos
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Historial de tickets registrados por {usuario?.nombre} ({usuario?.rut}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarMisTickets}
            disabled={loading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition flex items-center gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={onNuevoTicketClick}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nuevo Requerimiento</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2 bg-white rounded-2xl border border-slate-200 p-8">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span>Consultando estado de sus solicitudes...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No registra tickets activos</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Si requiere asistencia tecnica o reportar un incidente, cree un nuevo requerimiento.
          </p>
          <button
            type="button"
            onClick={onNuevoTicketClick}
            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Crear Ticket Ahora</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => onSeleccionarTicket(t.id)}
              className="bg-white hover:bg-slate-50/80 p-5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200 text-xs">
                    {t.codigo}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getPrioridadBadge(t.prioridad)}`}>
                    {t.prioridad}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase border ${getEstadoBadge(t.estado)}`}>
                    {t.estado.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-800 font-semibold leading-relaxed line-clamp-2">
                  {t.descripcion}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    {t.categoria}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(t.creadoEn).toLocaleDateString('es-CL')}
                  </span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <UserCheck className="w-3 h-3 text-indigo-600" />
                    {t.tecnico ? t.tecnico.nombre : 'En cola de asignacion'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end md:self-center text-slate-400 group-hover:text-indigo-600">
                <span className="text-xs font-semibold">Ver Ficha y Respuestas</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

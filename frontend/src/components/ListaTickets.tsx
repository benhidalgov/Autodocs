import React, { useState, useEffect, useMemo } from 'react';
import { TicketDTO, Estado } from '@shared/types';
import { fetchTickets, actualizarEstadoTicket } from '../services/api';
import {
  RotateCw,
  Search,
  Filter,
  Tag,
  Calendar,
  Building2,
  User,
  AlertCircle
} from 'lucide-react';

interface ListaTicketsProps {
  onNuevoTicketClick: () => void;
}

export const ListaTickets: React.FC<ListaTicketsProps> = ({ onNuevoTicketClick }) => {
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroDepto, setFiltroDepto] = useState<string>('todos');
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');

  const cargarTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTickets();
      setTickets(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar la lista de tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTickets();
  }, []);

  const handleCambiarEstado = async (id: number, nuevoEstado: Estado) => {
    setActualizandoId(id);
    try {
      const ticketActualizado = await actualizarEstadoTicket(id, nuevoEstado);
      // Actualizar estado local inmediatamente
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, estado: ticketActualizado.estado } : t))
      );
    } catch (err: any) {
      alert(`Error al actualizar estado: ${err.message || 'Error desconocido'}`);
    } finally {
      setActualizandoId(null);
    }
  };

  // Extraer departamentos únicos de los tickets para el filtro
  const departamentosDisponibles = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => {
      if (t.usuario?.departamento) {
        set.add(t.usuario.departamento);
      }
    });
    return Array.from(set).sort();
  }, [tickets]);

  // Filtrado reactivo de tickets
  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((ticket) => {
      // Filtro de Estado
      if (filtroEstado !== 'todos' && ticket.estado !== filtroEstado) {
        return false;
      }
      // Filtro de Departamento
      if (filtroDepto !== 'todos' && ticket.usuario?.departamento !== filtroDepto) {
        return false;
      }
      // Filtro de Búsqueda texto (código, nombre usuario, descripción, categoría)
      if (busquedaTexto.trim() !== '') {
        const query = busquedaTexto.toLowerCase();
        const codigo = ticket.codigo.toLowerCase();
        const desc = ticket.descripcion.toLowerCase();
        const categoria = ticket.categoria.toLowerCase();
        const usuarioNombre = ticket.usuario?.nombre.toLowerCase() || '';
        const usuarioRut = ticket.usuario?.rut.toLowerCase() || '';

        return (
          codigo.includes(query) ||
          desc.includes(query) ||
          categoria.includes(query) ||
          usuarioNombre.includes(query) ||
          usuarioRut.includes(query)
        );
      }
      return true;
    });
  }, [tickets, filtroEstado, filtroDepto, busquedaTexto]);

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'critica':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'alta':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'media':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'baja':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'abierto':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'en_proceso':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'resuelto':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'cerrado':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatearFecha = (fechaStr: string) => {
    try {
      const d = new Date(fechaStr);
      return d.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra superior de herramientas y filtros */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Título y contador */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Gestión de Tickets
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Visualiza, filtra y actualiza el estado de las solicitudes en tiempo real
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={cargarTickets}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition shadow-xs"
              title="Refrescar listado"
            >
              <RotateCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              onClick={onNuevoTicketClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition shadow-xs"
            >
              <span>+ Nuevo Ticket</span>
            </button>
          </div>
        </div>

        <hr className="my-4 border-slate-200" />

        {/* Controles de Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por código, solicitante, descripción..."
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50/50"
            />
          </div>

          {/* Filtro por Estado */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="todos">Todos los Estados</option>
              <option value="abierto">Abierto</option>
              <option value="en_proceso">En Proceso</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>

          {/* Filtro por Departamento */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filtroDepto}
              onChange={(e) => setFiltroDepto(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="todos">Todos los Departamentos</option>
              {departamentosDisponibles.map((dep) => (
                <option key={dep} value={dep}>
                  {dep}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={cargarTickets}
            className="underline font-semibold hover:text-rose-900 ml-4"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Tabla de Tickets */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Código & Fecha</th>
                <th className="py-3.5 px-4">Solicitante</th>
                <th className="py-3.5 px-4">Categoría & Detalle</th>
                <th className="py-3.5 px-4">Prioridad</th>
                <th className="py-3.5 px-4">Estado (Modificable)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <RotateCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
                    Cargando tickets de soporte...
                  </td>
                </tr>
              ) : ticketsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No se encontraron tickets con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                ticketsFiltrados.map((ticket) => {
                  const isUpdating = actualizandoId === ticket.id;

                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Código & Fecha */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded inline-block border border-sky-200/60 text-xs">
                          {ticket.codigo}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatearFecha(ticket.creadoEn)}
                        </div>
                      </td>

                      {/* Solicitante y Depto */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {ticket.usuario?.nombre || 'Usuario desconocido'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 font-mono">
                          RUT: {ticket.usuario?.rut}
                        </div>
                        <div className="text-xs text-slate-600 mt-1 inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {ticket.usuario?.departamento || 'Sin Depto'}
                        </div>
                      </td>

                      {/* Categoría y Descripción */}
                      <td className="py-4 px-4 align-top max-w-xs md:max-w-md">
                        <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {ticket.categoria}
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed line-clamp-3">
                          {ticket.descripcion}
                        </p>
                      </td>

                      {/* Prioridad */}
                      <td className="py-4 px-4 align-top">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider border ${getPrioridadBadge(
                            ticket.prioridad
                          )}`}
                        >
                          {ticket.prioridad}
                        </span>
                      </td>

                      {/* Selector de Estado */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="relative">
                            <select
                              value={ticket.estado}
                              disabled={isUpdating}
                              onChange={(e) =>
                                handleCambiarEstado(ticket.id, e.target.value as Estado)
                              }
                              className={`w-full text-xs font-semibold rounded-lg px-2.5 py-1.5 border appearance-none pr-7 transition cursor-pointer ${
                                isUpdating
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'focus:outline-none focus:ring-2 focus:ring-sky-500'
                              } ${getEstadoBadge(ticket.estado)}`}
                            >
                              <option value="abierto">Abierto</option>
                              <option value="en_proceso">En Proceso</option>
                              <option value="resuelto">Resuelto</option>
                              <option value="cerrado">Cerrado</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                              {isUpdating ? (
                                <RotateCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 9l-7 7-7-7"
                                  ></path>
                                </svg>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Cambia al instante en la base de datos
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer con resumen */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <span>
            Mostrando <strong>{ticketsFiltrados.length}</strong> de <strong>{tickets.length}</strong> tickets totales
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span> Abiertos: {tickets.filter(t => t.estado === 'abierto').length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> En Proceso: {tickets.filter(t => t.estado === 'en_proceso').length}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Resueltos: {tickets.filter(t => t.estado === 'resuelto').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

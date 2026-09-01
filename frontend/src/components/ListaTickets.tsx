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
  AlertCircle,
  Flame,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

interface ListaTicketsProps {
  onNuevoTicketClick: () => void;
  onSeleccionarTicket?: (ticketId: number) => void;
}

export const ListaTickets: React.FC<ListaTicketsProps> = ({
  onNuevoTicketClick,
  onSeleccionarTicket
}) => {
  const [tickets, setTickets] = useState<TicketDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroDepto, setFiltroDepto] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos');
  const [soloCriticos, setSoloCriticos] = useState<boolean>(false);
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
      if (t.solicitante?.departamento) {
        set.add(t.solicitante.departamento);
      }
    });
    return Array.from(set).sort();
  }, [tickets]);

  // Filtrado reactivo de tickets
  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((ticket) => {
      // Toggle de solo críticos
      if (soloCriticos && ticket.prioridad !== 'critica') {
        return false;
      }
      // Filtro de Estado
      if (filtroEstado !== 'todos' && ticket.estado !== filtroEstado) {
        return false;
      }
      // Filtro de Departamento
      if (filtroDepto !== 'todos' && ticket.solicitante?.departamento !== filtroDepto) {
        return false;
      }
      // Filtro de Prioridad
      if (filtroPrioridad !== 'todos' && ticket.prioridad !== filtroPrioridad) {
        return false;
      }
      // Filtro de Búsqueda texto (código, nombre usuario, descripción, categoría, CI)
      if (busquedaTexto.trim() !== '') {
        const query = busquedaTexto.toLowerCase();
        const codigo = ticket.codigo.toLowerCase();
        const desc = ticket.descripcion.toLowerCase();
        const categoria = ticket.categoria.toLowerCase();
        const ci = ticket.ciAfectado?.toLowerCase() || '';
        const usuarioNombre = ticket.solicitante?.nombre.toLowerCase() || '';
        const usuarioRut = ticket.solicitante?.rut.toLowerCase() || '';

        return (
          codigo.includes(query) ||
          desc.includes(query) ||
          categoria.includes(query) ||
          ci.includes(query) ||
          usuarioNombre.includes(query) ||
          usuarioRut.includes(query)
        );
      }
      return true;
    });
  }, [tickets, filtroEstado, filtroDepto, filtroPrioridad, soloCriticos, busquedaTexto]);

  // Exportar listado filtrado a formato CSV UTF-8 con BOM
  const handleExportarCSV = () => {
    if (ticketsFiltrados.length === 0) {
      alert('No hay tickets visibles para exportar con los filtros seleccionados.');
      return;
    }

    const encabezados = [
      'Codigo_Ticket',
      'Fecha_Creacion',
      'Solicitante_Nombre',
      'Solicitante_RUT',
      'Departamento',
      'Solicitante_Email',
      'Categoria',
      'Prioridad',
      'Estado',
      'CI_CMDB_Afectado',
      'Tecnico_Asignado',
      'SLA_Limite_Minutos',
      'Descripcion'
    ];

    const filas = ticketsFiltrados.map((t) => [
      `"${t.codigo}"`,
      `"${new Date(t.creadoEn).toLocaleString('es-CL')}"`,
      `"${(t.solicitante?.nombre || 'Desconocido').replace(/"/g, '""')}"`,
      `"${t.solicitante?.rut || ''}"`,
      `"${(t.solicitante?.departamento || '').replace(/"/g, '""')}"`,
      `"${t.solicitante?.email || ''}"`,
      `"${t.categoria}"`,
      `"${t.prioridad}"`,
      `"${t.estado}"`,
      `"${t.ciAfectado || 'N/A'}"`,
      `"${(t.tecnico?.nombre || 'Sin Asignar').replace(/"/g, '""')}"`,
      `"${t.slaLimiteMinutos}"`,
      `"${t.descripcion.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
    ]);

    const contenidoCSV = '\uFEFF' + [encabezados.join(';'), ...filas.map((f) => f.join(';'))].join('\r\n');
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const fechaTimestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '_');
    link.href = url;
    link.download = `reporte_tickets_operaciones_${fechaTimestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'critica':
        return 'bg-purple-950/80 text-purple-200 border-purple-800';
      case 'alta':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'media':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
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
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Consola de Triaje y Operaciones
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                [{ticketsFiltrados.length} Visibles]
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Supervisión de tickets corporativos, SLA, vinculación CMDB y auditoría
            </p>
          </div>

          {/* Botones de acción y exportación */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportarCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition shadow-xs cursor-pointer"
              title="Exportar listado actual a formato Excel/CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>[Exportar CSV]</span>
            </button>

            <button
              type="button"
              onClick={cargarTickets}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-xs cursor-pointer"
              title="Refrescar listado"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              onClick={onNuevoTicketClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm shadow-indigo-600/20 cursor-pointer"
            >
              <span>+ Nuevo Ticket</span>
            </button>
          </div>
        </div>

        <hr className="my-4 border-slate-200" />

        {/* Controles de Filtros Avanzados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar código, CI, solicitante..."
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Filtro por Estado */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="todos">Todos los Estados</option>
              <option value="abierto">[Abierto]</option>
              <option value="en_proceso">[En Proceso]</option>
              <option value="pendiente_usuario">[Pendiente Usuario]</option>
              <option value="resuelto">[Resuelto]</option>
              <option value="cerrado">[Cerrado]</option>
            </select>
          </div>

          {/* Filtro por Prioridad */}
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="todos">Todas las Prioridades</option>
              <option value="critica">[Prioridad Crítica P1]</option>
              <option value="alta">[Prioridad Alta P2]</option>
              <option value="media">[Prioridad Media P3]</option>
              <option value="baja">[Prioridad Baja P4]</option>
            </select>
          </div>

          {/* Filtro por Departamento */}
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filtroDepto}
              onChange={(e) => setFiltroDepto(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
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

        {/* Chips de filtro rápido */}
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold text-[11px]">Acceso Rápido:</span>
          <button
            type="button"
            onClick={() => setSoloCriticos(!soloCriticos)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 border ${
              soloCriticos
                ? 'bg-purple-900 text-purple-100 border-purple-700 shadow-xs'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>[SOLO CRITICOS P1]</span>
          </button>

          {(filtroEstado !== 'todos' || filtroDepto !== 'todos' || filtroPrioridad !== 'todos' || soloCriticos || busquedaTexto) && (
            <button
              type="button"
              onClick={() => {
                setFiltroEstado('todos');
                setFiltroDepto('todos');
                setFiltroPrioridad('todos');
                setSoloCriticos(false);
                setBusquedaTexto('');
              }}
              className="text-[11px] text-slate-500 hover:text-indigo-600 underline font-mono ml-auto"
            >
              Limpiar Todos los Filtros
            </button>
          )}
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
                        <button
                          type="button"
                          onClick={() => onSeleccionarTicket?.(ticket.id)}
                          className="font-mono font-bold text-sky-700 hover:text-indigo-800 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded inline-block border border-sky-200/60 text-xs transition text-left cursor-pointer"
                        >
                          {ticket.codigo}
                        </button>
                        <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatearFecha(ticket.creadoEn)}
                        </div>
                      </td>

                      {/* Solicitante y Depto */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {ticket.solicitante?.nombre || 'Usuario desconocido'}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 font-mono">
                          RUT: {ticket.solicitante?.rut}
                        </div>
                        <div className="text-xs text-slate-600 mt-1 inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {ticket.solicitante?.departamento || 'Sin Depto'}
                        </div>
                      </td>

                      {/* Categoría, Descripción y CI */}
                      <td className="py-4 px-4 align-top max-w-xs md:max-w-md">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                            <Tag className="w-3 h-3 text-slate-400" />
                            {ticket.categoria}
                          </span>
                          {ticket.ciAfectado && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-bold">
                              [CI: {ticket.ciAfectado}]
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
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

                      {/* Estado y Actualización Rápida */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="relative inline-block w-full">
                            <select
                              value={ticket.estado}
                              onChange={(e) =>
                                handleCambiarEstado(ticket.id, e.target.value as Estado)
                              }
                              disabled={isUpdating}
                              className={`w-full appearance-none px-3 py-1.5 pr-8 rounded-lg text-xs font-medium border uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-500 transition-shadow ${getEstadoBadge(
                                ticket.estado
                              )} ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                            >
                              <option value="abierto">Abierto</option>
                              <option value="en_proceso">En Proceso</option>
                              <option value="pendiente_usuario">Pendiente Usuario</option>
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
                          {onSeleccionarTicket && (
                            <button
                              type="button"
                              onClick={() => onSeleccionarTicket(ticket.id)}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition text-left"
                            >
                              Ver Ficha & Trazabilidad &rarr;
                            </button>
                          )}
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

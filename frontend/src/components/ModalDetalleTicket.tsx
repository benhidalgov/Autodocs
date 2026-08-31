import React, { useState, useEffect } from 'react';
import { TicketDTO, UsuarioDTO, Estado, Prioridad } from '@shared/types';
import {
  fetchTicketDetalle,
  agregarComentario,
  actualizarEstadoTicket,
  asignarTecnicoTicket,
  fetchTecnicos
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  X,
  User,
  Building2,
  Tag,
  Send,
  Lock,
  MessageSquare,
  Clock,
  Server,
  Loader2,
  UserCheck
} from 'lucide-react';

interface ModalDetalleTicketProps {
  ticketId: number;
  onClose: () => void;
  onTicketUpdated: () => void;
}

export const ModalDetalleTicket: React.FC<ModalDetalleTicketProps> = ({
  ticketId,
  onClose,
  onTicketUpdated
}) => {
  const { usuario, isStaff } = useAuth();
  const [ticket, setTicket] = useState<TicketDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para nuevo comentario
  const [nuevoContenido, setNuevoContenido] = useState('');
  const [esInterno, setEsInterno] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  // Estados para asignacion y actualizacion
  const [tecnicosDisponibles, setTecnicosDisponibles] = useState<UsuarioDTO[]>([]);
  const [ciInput, setCiInput] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);

  const cargarDetalle = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTicketDetalle(ticketId);
      setTicket(data);
      setCiInput(data.ciAfectado || '');
    } catch (err: any) {
      setError(err.message || '[ERROR] Error al cargar detalle del ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDetalle();
    if (isStaff) {
      fetchTecnicos()
        .then(setTecnicosDisponibles)
        .catch(() => {});
    }
  }, [ticketId, isStaff]);

  const handleEnviarComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoContenido.trim()) return;

    setEnviandoComentario(true);
    try {
      await agregarComentario(ticketId, {
        contenido: nuevoContenido.trim(),
        esInterno: isStaff ? esInterno : false
      });
      setNuevoContenido('');
      setEsInterno(false);
      await cargarDetalle();
      onTicketUpdated();
    } catch (err: any) {
      alert(`[ERROR] No se pudo publicar el comentario: ${err.message}`);
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleCambiarEstado = async (nuevoEstado: Estado) => {
    if (!isStaff) return;
    setGuardandoEstado(true);
    try {
      await actualizarEstadoTicket(ticketId, nuevoEstado, ciInput.trim() || undefined);
      await cargarDetalle();
      onTicketUpdated();
    } catch (err: any) {
      alert(`[ERROR] Error al actualizar estado: ${err.message}`);
    } finally {
      setGuardandoEstado(false);
    }
  };

  const handleAsignarTecnico = async (tecnicoIdStr: string) => {
    if (!isStaff) return;
    const tecId = tecnicoIdStr ? parseInt(tecnicoIdStr, 10) : null;
    try {
      await asignarTecnicoTicket(ticketId, tecId);
      await cargarDetalle();
      onTicketUpdated();
    } catch (err: any) {
      alert(`[ERROR] Error al asignar tecnico: ${err.message}`);
    }
  };

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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-mono font-bold text-xs">
              {ticket?.codigo || `TCK-ID-${ticketId}`}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Ficha de Atencion y Trazabilidad
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                [REGISTRO-INMUTABLE]
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Cargando detalle del ticket...</span>
            </div>
          ) : error || !ticket ? (
            <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs">
              {error || '[ERROR] No se encontro informacion del ticket'}
            </div>
          ) : (
            <>
              {/* Tarjeta de Metadatos Principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* Columna 1: Solicitante */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    [SOLICITANTE]
                  </div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    {ticket.solicitante?.nombre || 'Usuario Desconocido'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    RUT: {ticket.solicitante?.rut}
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    {ticket.solicitante?.departamento}
                  </div>
                </div>

                {/* Columna 2: Categoria y Prioridad */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    [CLASIFICACION]
                  </div>
                  <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    {ticket.categoria}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getPrioridadBadge(ticket.prioridad)}`}>
                      {ticket.prioridad}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase border ${getEstadoBadge(ticket.estado)}`}>
                      {ticket.estado.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    SLA Limite: {ticket.slaLimiteMinutos} min
                  </div>
                </div>

                {/* Columna 3: Asignacion y CMDB */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    [INFRAESTRUCTURA & TECNICO]
                  </div>

                  {isStaff ? (
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Tecnico Responsable:</label>
                      <select
                        value={ticket.tecnicoId || ''}
                        onChange={(e) => handleAsignarTecnico(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 rounded p-1 font-medium focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">[SIN ASIGNAR]</option>
                        {tecnicosDisponibles.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre} ({t.rol})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {ticket.tecnico ? ticket.tecnico.nombre : '[En cola de asignacion]'}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-600 flex items-center gap-1 pt-1">
                    <Server className="w-3 h-3 text-slate-400" />
                    CI CMDB: <span className="font-mono font-bold text-indigo-700">{ticket.ciAfectado || '[No Vinculado]'}</span>
                  </div>
                </div>
              </div>

              {/* Descripcion Original */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  [REQUERIMIENTO INICIAL REPORTADO]
                </div>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {ticket.descripcion}
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Fecha de emision: {new Date(ticket.creadoEn).toLocaleString('es-CL')}
                </div>
              </div>

              {/* Panel de Resolucion y Estado (Solo Staff) */}
              {isStaff && (
                <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 space-y-3">
                  <div className="text-xs font-bold text-indigo-950 flex items-center justify-between">
                    <span>Acciones de Mesa de Ayuda y Gobernanza</span>
                    {guardandoEstado && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Cambiar Estado del Ticket:
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {(['abierto', 'en_proceso', 'pendiente_usuario', 'resuelto', 'cerrado'] as Estado[]).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleCambiarEstado(st)}
                            disabled={guardandoEstado || ticket.estado === st}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition ${
                              ticket.estado === st
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {st.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Vincular Componente CMDB:
                      </label>
                      <input
                        type="text"
                        value={ciInput}
                        onChange={(e) => setCiInput(e.target.value)}
                        placeholder="ej: BALANCER001 o PRODMIDWARE003"
                        className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conversacion / Timeline de Comentarios */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Historial de Respuestas y Trazabilidad ({ticket.comentarios?.length || 0})</span>
                </div>

                {(!ticket.comentarios || ticket.comentarios.length === 0) ? (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400">
                    Aun no hay comentarios ni notas registradas en este ticket.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {ticket.comentarios.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3.5 rounded-xl border text-xs ${
                          c.esInterno
                            ? 'bg-purple-50/70 border-purple-200 text-purple-950'
                            : c.autor?.id === usuario?.id
                            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                            : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">
                              {c.autor?.nombre || 'Usuario'}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/80 border rounded text-slate-600">
                              [{c.autor?.rol || 'USER'}]
                            </span>
                            {c.esInterno && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-purple-200 text-purple-900 rounded flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                [NOTA INTERNA SOPORTE]
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(c.creadoEn).toLocaleTimeString('es-CL', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">
                          {c.contenido}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formulario para agregar respuesta / nota */}
              <form onSubmit={handleEnviarComentario} className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Publicar Actualizacion o Respuesta
                  </label>
                  <textarea
                    rows={3}
                    value={nuevoContenido}
                    onChange={(e) => setNuevoContenido(e.target.value)}
                    placeholder="Escriba su respuesta formal o detalle del diagnostico..."
                    disabled={enviandoComentario}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>

                <div className="flex items-center justify-between">
                  {isStaff ? (
                    <label className="flex items-center gap-2 text-xs font-semibold text-purple-900 cursor-pointer bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                      <input
                        type="checkbox"
                        checked={esInterno}
                        onChange={(e) => setEsInterno(e.target.checked)}
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <Lock className="w-3.5 h-3.5 text-purple-700" />
                      <span>Nota Interna (Oculta para el Solicitante)</span>
                    </label>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Su mensaje sera notificado al equipo de soporte.
                    </span>
                  )}

                  <button
                    type="submit"
                    disabled={enviandoComentario || !nuevoContenido.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {enviandoComentario ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{esInterno ? 'Guardar Nota Interna' : 'Enviar Comentario'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

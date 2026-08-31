import React, { useState, useEffect } from 'react';
import { MetricasSLADTO, CorrelacionIncidentesDTO } from '@shared/types';
import { fetchMetricasSLA, fetchCorrelacionIncidentes } from '../services/api';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Building2,
  RotateCw,
  Server,
  TrendingUp,
  Loader2,
  ShieldAlert,
  Network
} from 'lucide-react';

export const DashboardSLA: React.FC = () => {
  const [metricas, setMetricas] = useState<MetricasSLADTO | null>(null);
  const [correlaciones, setCorrelaciones] = useState<CorrelacionIncidentesDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dataMetricas, dataCorrelaciones] = await Promise.all([
        fetchMetricasSLA(),
        fetchCorrelacionIncidentes().catch(() => [])
      ]);
      setMetricas(dataMetricas);
      setCorrelaciones(dataCorrelaciones);
    } catch (err: any) {
      setError(err.message || '[ERROR] Error al cargar metricas SLA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="space-y-6">
      {/* Cabecera del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Dashboard de Gobernanza y Rendimiento Operativo
              </h2>
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
                [TELEMETRIA-SLA-MTTR] &bull; [CMDB-ANALYTICS]
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Monitoreo en tiempo real de tiempos de respuesta, resolucion y distribucion de incidentes.
          </p>
        </div>

        <button
          type="button"
          onClick={cargarDatos}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition flex items-center gap-2"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar Metricas</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center gap-2 bg-white rounded-2xl border border-slate-200 p-8">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <span>Calculando indicadores de desempeno, SLA y correlacion de topologia...</span>
        </div>
      ) : error || !metricas ? (
        <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs">
          {error || '[ERROR] No se pudieron cargar las metricas analiticas'}
        </div>
      ) : (
        <>
          {/* Fila de Tarjetas KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Cumplimiento SLA */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  [CUMPLIMIENTO-SLA]
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {metricas.cumplimientoSlaPorcentaje}%
              </div>
              <div className="text-[11px] text-slate-500">
                Objetivo operacional corporativo &ge; 95%
              </div>
            </div>

            {/* KPI 2: MTTR Promedio */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  [MTTR-PROMEDIO]
                </span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {metricas.mttrPromedioMinutos} <span className="text-xs font-normal text-slate-500">min</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Tiempo medio de recuperacion de servicio
              </div>
            </div>

            {/* KPI 3: Criticos Activos */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  [CRITICOS-ACTIVOS]
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">
                {metricas.criticosActivos}
              </div>
              <div className="text-[11px] text-rose-600 font-medium">
                Incidentes de severidad P1 / P2 en atencion
              </div>
            </div>

            {/* KPI 4: Total de Solicitudes */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  [TOTAL-TICKETS]
                </span>
                <Activity className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {metricas.totalTickets}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 font-mono">
                <span className="text-amber-700">{metricas.abiertos} abiertos</span> &bull;
                <span className="text-indigo-700">{metricas.enProceso} en curso</span>
              </div>
            </div>
          </div>

          {/* MATRIZ DE CORRELACION DE INCIDENTES Y CLUSTERES CMDB (FASE 3) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Matriz de Correlacion de Incidentes y Deteccion de Clusteres (CMDB)
                  </h3>
                  <span className="text-[11px] font-mono text-purple-700">
                    [CORRELACION-TOPOLOGICA]
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded font-bold">
                {correlaciones.length} CIs CON INCIDENTES
              </span>
            </div>

            {correlaciones.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400">
                No hay incidentes concurrentes agrupados en la topologia actualmente.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {correlaciones.map((item) => (
                  <div
                    key={item.ciId}
                    className={`p-4 rounded-xl border transition space-y-2.5 ${
                      item.alertaMasiva
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-100">
                        {item.ciId}
                      </span>
                      {item.alertaMasiva ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-rose-200 text-rose-900 rounded flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          [ALERTA MASIVA]
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded">
                          [{item.capa.split('_')[0]}]
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-xs text-slate-800">
                      {item.ciNombre}
                    </div>

                    <p className="text-[11px] text-slate-600 leading-tight">
                      {item.descripcionImpacto}
                    </p>

                    <div className="flex flex-wrap items-center gap-1 pt-1">
                      <span className="text-[10px] text-slate-400 font-mono">Tickets:</span>
                      {item.codigosTickets.map((cod) => (
                        <span key={cod} className="font-mono text-[10px] bg-white px-1.5 py-0.2 rounded border border-slate-200 text-slate-700">
                          {cod}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desgloses por Categoria y Departamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Distribucion por Categoria */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Distribucion por Categoria de Servicio
                </h3>
              </div>

              <div className="space-y-3">
                {metricas.distribucionCategorias.map((item) => {
                  const pct = metricas.totalTickets > 0 ? Math.round((item.cantidad / metricas.totalTickets) * 100) : 0;
                  return (
                    <div key={item.categoria} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{item.categoria}</span>
                        <span className="font-mono text-slate-500 font-bold">
                          {item.cantidad} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Distribucion por Departamento */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Impacto por Area Usuaria / Gerencia
                </h3>
              </div>

              <div className="space-y-3">
                {metricas.distribucionDepartamentos.map((item) => {
                  const pct = metricas.totalTickets > 0 ? Math.round((item.cantidad / metricas.totalTickets) * 100) : 0;
                  return (
                    <div key={item.departamento} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700">{item.departamento}</span>
                        <span className="font-mono text-slate-500 font-bold">
                          {item.cantidad} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Enlace y Deteccion de Incidentes Mayores / CMDB */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Correlacion con Topologia de Infraestructura (CMDB)
                  </h3>
                  <span className="text-[11px] font-mono text-indigo-300">
                    [FEED-HACIA-RED-NEURONAL]
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                [ACTIVO]
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Cada ticket diagnosticado y clasificado con su componente de infraestructura asociado alimenta directamente los pesos sinapticos del grafo operacional, retroalimentando la deduccion automatica de causa raiz en la boveda central.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { MetricasSLADTO } from '@shared/types';
import { fetchMetricasSLA } from '../services/api';
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
  Loader2
} from 'lucide-react';

export const DashboardSLA: React.FC = () => {
  const [metricas, setMetricas] = useState<MetricasSLADTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargarMetricas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMetricasSLA();
      setMetricas(data);
    } catch (err: any) {
      setError(err.message || '[ERROR] Error al cargar metricas SLA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMetricas();
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
                [TELEMETRIA-SLA-MTTR]
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Monitoreo en tiempo real de tiempos de respuesta, resolucion y distribucion de incidentes.
          </p>
        </div>

        <button
          type="button"
          onClick={cargarMetricas}
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
          <span>Calculando indicadores de desempeno y SLA...</span>
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

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, User, KeyRound, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identificador.trim() || !password.trim()) {
      setError('[ERROR] Debe ingresar su identificador (RUT o Email) y contrasena.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login({ identificador: identificador.trim(), password: password.trim() });
    } catch (err: any) {
      setError(err.message || '[ERROR] Credenciales no validas o cuenta inactiva.');
    } finally {
      setSubmitting(false);
    }
  };

  const seleccionarCuentaDemo = (demoId: string, demoPass: string) => {
    setIdentificador(demoId);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Cabecera Corporativa */}
        <div className="bg-slate-900 px-8 py-7 text-white border-b border-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 leading-tight">
                Consola de Soporte y Autoservicio
              </h2>
              <span className="inline-block mt-0.5 text-[11px] font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                [AUTORIZACION-RBAC]
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Ingrese con sus credenciales corporativas (RUT o correo electronico).
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Identificador (RUT o Correo)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="ej: 11222333-9 o admin@empresa.cl"
                disabled={submitting || isLoading}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Contrasena Corporativa
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={submitting || isLoading}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || isLoading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting || isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validando credenciales...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Ingresar a la Consola</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Selector de Cuentas de Demostracion */}
        <div className="bg-slate-50 border-t border-slate-100 p-6">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Cuentas de Demostracion (RBAC)</span>
            <span className="text-[10px] text-slate-400 font-mono">[CLICK PARA AUTOCOMPLETAR]</span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => seleccionarCuentaDemo('admin@empresa.cl', 'admin2026')}
              className="w-full text-left p-2.5 bg-white hover:bg-indigo-50/60 border border-slate-200 rounded-lg text-xs transition flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-slate-800 group-hover:text-indigo-700">
                  Carlos Mendoza
                </div>
                <div className="text-[11px] text-slate-500 font-mono">admin@empresa.cl &bull; 11222333-9</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded font-bold">
                [SUPERVISOR_ADMIN]
              </span>
            </button>

            <button
              type="button"
              onClick={() => seleccionarCuentaDemo('soporte@empresa.cl', 'soporte2026')}
              className="w-full text-left p-2.5 bg-white hover:bg-indigo-50/60 border border-slate-200 rounded-lg text-xs transition flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-slate-800 group-hover:text-indigo-700">
                  Valentina Rojas
                </div>
                <div className="text-[11px] text-slate-500 font-mono">soporte@empresa.cl &bull; 15678912-7</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 rounded font-bold">
                [AGENTE_SOPORTE]
              </span>
            </button>

            <button
              type="button"
              onClick={() => seleccionarCuentaDemo('ana.silva@empresa.cl', 'usuario2026')}
              className="w-full text-left p-2.5 bg-white hover:bg-indigo-50/60 border border-slate-200 rounded-lg text-xs transition flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-slate-800 group-hover:text-indigo-700">
                  Ana Silva (RRHH)
                </div>
                <div className="text-[11px] text-slate-500 font-mono">ana.silva@empresa.cl &bull; 12345678-5</div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-bold">
                [SOLICITANTE]
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

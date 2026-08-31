import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { validateRut, formatRut } from '@shared/rut';
import { UsuarioDTO, ElementoCMDB } from '@shared/types';
import { useDebounce } from '../hooks/useDebounce';
import { fetchUsuarioPorRut, crearTicket, fetchCatalogoCMDB } from '../services/api';
import { CheckCircle2, AlertCircle, Loader2, Send, Sparkles, UserCheck, ShieldAlert, Server } from 'lucide-react';

const ticketFormSchema = z.object({
  rut: z
    .string()
    .min(1, 'El RUT es obligatorio')
    .refine((val) => validateRut(val), {
      message: 'RUT inválido (Módulo 11 incorrecto o formato no válido)'
    }),
  categoria: z.string().min(1, 'Selecciona una categoría'),
  prioridad: z.enum(['baja', 'media', 'alta', 'critica'] as const, {
    errorMap: () => ({ message: 'Selecciona una prioridad válida' })
  }),
  descripcion: z
    .string()
    .min(5, 'La descripción debe tener al menos 5 caracteres')
    .max(1000, 'La descripción no puede superar los 1000 caracteres'),
  ciAfectado: z.string().optional()
});

type TicketFormData = z.infer<typeof ticketFormSchema>;

interface CrearTicketProps {
  onTicketCreado: () => void;
}

export const CrearTicket: React.FC<CrearTicketProps> = ({ onTicketCreado }) => {
  const [rutInput, setRutInput] = useState('');
  const debouncedRut = useDebounce(rutInput, 400);

  const [usuarioEncontrado, setUsuarioEncontrado] = useState<UsuarioDTO | null>(null);
  const [buscandoUsuario, setBuscandoUsuario] = useState(false);
  const [errorUsuario, setErrorUsuario] = useState<string | null>(null);
  const [catalogoCMDB, setCatalogoCMDB] = useState<ElementoCMDB[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors }
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      rut: '',
      categoria: '',
      prioridad: 'media',
      descripcion: '',
      ciAfectado: ''
    }
  });

  // Manejar el debounce de 400ms sobre el RUT
  useEffect(() => {
    const checkRut = async () => {
      const trimmed = debouncedRut.trim();

      if (!trimmed) {
        setUsuarioEncontrado(null);
        setErrorUsuario(null);
        return;
      }

      // Validar si el RUT es matemáticamente válido con Módulo 11
      if (!validateRut(trimmed)) {
        setUsuarioEncontrado(null);
        setErrorUsuario('El RUT ingresado no cumple con el algoritmo de rut, ni rut ingresado');
        return;
      }

      const normalizedRut = formatRut(trimmed);
      setValue('rut', normalizedRut, { shouldValidate: true });

      // Consultar al backend
      setBuscandoUsuario(true);
      setErrorUsuario(null);

      try {
        const usuario = await fetchUsuarioPorRut(normalizedRut);
        setUsuarioEncontrado(usuario);
        setErrorUsuario(null);
      } catch (err: any) {
        setUsuarioEncontrado(null);
        setErrorUsuario(err.message || 'El RUT no está registrado en la base de usuarios.');
      } finally {
        setBuscandoUsuario(false);
      }
    };

    checkRut();
  }, [debouncedRut, setValue]);

  useEffect(() => {
    fetchCatalogoCMDB()
      .then(setCatalogoCMDB)
      .catch(() => {});
  }, []);

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRutInput(val);
    setValue('rut', val);
    setMensajeExito(null);
    setServerError(null);
  };

  const onSubmit = async (data: TicketFormData) => {
    if (!usuarioEncontrado) {
      setErrorUsuario('No se puede crear el ticket: el usuario debe estar registrado en el sistema.');
      return;
    }

    setSubmitting(true);
    setServerError(null);
    setMensajeExito(null);

    try {
      const nuevo = await crearTicket({
        rut: formatRut(data.rut),
        categoria: data.categoria,
        prioridad: data.prioridad,
        descripcion: data.descripcion,
        ciAfectado: data.ciAfectado ? data.ciAfectado : undefined
      });

      setMensajeExito(`¡Ticket ${nuevo.codigo} creado exitosamente para ${usuarioEncontrado.nombre}!`);
      reset();
      setRutInput('');
      setUsuarioEncontrado(null);
      onTicketCreado();
    } catch (err: any) {
      setServerError(err.message || 'Error al enviar el ticket al servidor');
    } finally {
      setSubmitting(false);
    }
  };

  // Botón rápido para autocompletar RUTs válidos del Seed
  const cargarRutEjemplo = (rut: string) => {
    setRutInput(rut);
    setValue('rut', rut, { shouldValidate: true });
    setMensajeExito(null);
    setServerError(null);
  };

  const isFormBlockeado = !usuarioEncontrado || buscandoUsuario;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-400/30">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Crear Nuevo Ticket de Soporte</h2>
              <p className="text-slate-300 text-sm mt-0.5">
                Ingresa el RUT para validar y autocompletar tus datos automáticamente
              </p>
            </div>
          </div>

          {/* Quick-select pills */}
          <div className="mt-4 pt-4 border-t border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400">RUTs precargados de prueba:</span>
            <button
              type="button"
              onClick={() => cargarRutEjemplo('12345678-5')}
              className="bg-slate-800 hover:bg-slate-700 text-sky-300 px-2.5 py-1 rounded-md border border-slate-700 transition"
            >
              12345678-5 (RRHH)
            </button>
            <button
              type="button"
              onClick={() => cargarRutEjemplo('11222333-9')}
              className="bg-slate-800 hover:bg-slate-700 text-sky-300 px-2.5 py-1 rounded-md border border-slate-700 transition"
            >
              11222333-9 (TI)
            </button>
            <button
              type="button"
              onClick={() => cargarRutEjemplo('15678912-7')}
              className="bg-slate-800 hover:bg-slate-700 text-sky-300 px-2.5 py-1 rounded-md border border-slate-700 transition"
            >
              15678912-7 (Operaciones)
            </button>
          </div>
        </div>

        {/* Notificaciones globales */}
        {mensajeExito && (
          <div className="m-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{mensajeExito}</div>
          </div>
        )}

        {serverError && (
          <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm font-medium">{serverError}</div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-6">
          {/* Sección RUT y Verificación */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Campo RUT */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  RUT Solicitante <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ej: 12345678-9"
                    value={rutInput}
                    onChange={handleRutChange}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm font-medium transition focus:outline-none focus:ring-2 ${
                      errorUsuario
                        ? 'border-rose-300 focus:ring-rose-400 bg-rose-50/40 text-rose-900'
                        : usuarioEncontrado
                        ? 'border-emerald-300 focus:ring-emerald-400 bg-emerald-50/30 text-slate-900'
                        : 'border-slate-300 focus:ring-sky-500 bg-white'
                    }`}
                  />
                  <div className="absolute right-3 top-2.5">
                    {buscandoUsuario && (
                      <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
                    )}
                    {!buscandoUsuario && usuarioEncontrado && (
                      <UserCheck className="w-5 h-5 text-emerald-600" />
                    )}
                    {!buscandoUsuario && errorUsuario && (
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                    )}
                  </div>
                </div>
                {errors.rut && (
                  <p className="text-xs text-rose-600 mt-1">{errors.rut.message}</p>
                )}
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Validación automática con algoritmo de ruts y sin coincidencias dentro de la DB. :x
                </span>
              </div>

              {/* Nombre autocompletado */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Nombre (Autocompletado)
                </label>
                <input
                  type="text"
                  disabled
                  value={usuarioEncontrado?.nombre || ''}
                  placeholder="Se completará al validar RUT"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-100/80 text-slate-700 text-sm font-medium cursor-not-allowed select-none"
                />
              </div>

              {/* Departamento autocompletado */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Departamento (Autocompletado)
                </label>
                <input
                  type="text"
                  disabled
                  value={usuarioEncontrado?.departamento || ''}
                  placeholder="Se completará al validar RUT"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-100/80 text-slate-700 text-sm font-medium cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Banner de estado de usuario */}
            {errorUsuario && (
              <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>Aviso:</strong> {errorUsuario} El envío permanecerá bloqueado hasta ingresar un RUT válido registrado.
                </span>
              </div>
            )}

            {usuarioEncontrado && (
              <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  Usuario verificado: <strong>{usuarioEncontrado.nombre}</strong> &bull; {usuarioEncontrado.email}
                </span>
                <span className="text-[11px] font-mono uppercase bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
                  {usuarioEncontrado.rut}
                </span>
              </div>
            )}
          </div>

          <hr className="border-slate-200" />

          {/* Categoría y Prioridad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Categoría <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('categoria')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">-- Selecciona una categoría --</option>
                <option value="Hardware">Hardware / Equipos</option>
                <option value="Software">Software / Aplicaciones</option>
                <option value="Redes y Conectividad">Redes y Conectividad / VPN</option>
                <option value="Accesos y Cuentas">Accesos y Contraseñas</option>
                <option value="Telefonía">Telefonía / Comunicaciones</option>
                <option value="Otro">Otro requerimiento</option>
              </select>
              {errors.categoria && (
                <p className="text-xs text-rose-600 mt-1">{errors.categoria.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Prioridad <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('prioridad')}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica (Interrupción total)</option>
              </select>
              {errors.prioridad && (
                <p className="text-xs text-rose-600 mt-1">{errors.prioridad.message}</p>
              )}
            </div>
          </div>

          {/* Componente de Infraestructura (CMDB) - Opcional */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-600" />
                Componente Afectado (CMDB)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">[OPCIONAL - INFERIBLE VIA GRAFO]</span>
            </label>
            <select
              {...register('ciAfectado')}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">-- [No estoy seguro / Detección Automática] --</option>
              {catalogoCMDB.map((ci) => (
                <option key={ci.id} value={ci.id}>
                  [{ci.capa.split('_')[0]}] {ci.id} - {ci.nombre} ({ci.ip})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Si no seleccionas un componente, el motor de inferencia deducirá automáticamente el CI y el radio de impacto.
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Descripción del Problema o Requerimiento <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              {...register('descripcion')}
              placeholder="Describe detalladamente la incidencia, pasos para reproducirla y mensajes de error observados..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-y"
            ></textarea>
            {errors.descripcion && (
              <p className="text-xs text-rose-600 mt-1">{errors.descripcion.message}</p>
            )}
          </div>

          {/* Botón de Enviar */}
          <div className="pt-2 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {isFormBlockeado ? (
                <span className="text-amber-700 font-medium flex items-center gap-1">
                  &bull; Requiere RUT válido registrado para habilitar el botón de envío
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">
                  &bull; Todo listo para registrar el ticket
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isFormBlockeado || submitting}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm text-white shadow-sm transition ${
                isFormBlockeado || submitting
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-sky-600/20'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Crear Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

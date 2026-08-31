/**
 * Módulo de validación y formateo de RUT chileno (Módulo 11)
 * Compartido entre Frontend y Backend
 */

/**
 * Limpia el RUT quitando puntos, guiones y espacios en blanco,
 * y convirtiendo el dígito verificador a mayúscula.
 */
export function cleanRut(rut: string): string {
  if (typeof rut !== 'string') return '';
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
}

/**
 * Calcula el dígito verificador para un número de RUT dado usando Módulo 11.
 * @param rutDigits Cadena de dígitos del cuerpo del RUT (sin dígito verificador).
 */
export function calculateDv(rutDigits: string): string {
  let sum = 0;
  let multiplier = 2;

  for (let i = rutDigits.length - 1; i >= 0; i--) {
    sum += parseInt(rutDigits[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return remainder.toString();
}

/**
 * Valida si un RUT chileno es válido según el algoritmo Módulo 11.
 */
export function validateRut(rut: string): boolean {
  if (!rut || typeof rut !== 'string') return false;

  const cleaned = cleanRut(rut);
  // Un RUT chileno estándar tiene entre 7 y 9 caracteres (cuerpo de 6 a 8 dígitos + 1 DV)
  if (cleaned.length < 7 || cleaned.length > 9) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  // El cuerpo solo debe tener dígitos
  if (!/^\d+$/.test(body)) return false;

  const expectedDv = calculateDv(body);
  return dv === expectedDv;
}

/**
 * Formatea un RUT a la forma normalizada canónica: 12345678-9 (sin puntos, con guion y DV en mayúscula).
 * Si el RUT no es válido o está incompleto, devuelve la cadena limpia con guion si es posible.
 */
export function formatRut(rut: string): string {
  const cleaned = cleanRut(rut);
  if (cleaned.length <= 1) return cleaned;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  return `${body}-${dv}`;
}

/**
 * Formatea un RUT con puntos y guion: 12.345.678-9 (opcional para presentación estética en UI).
 */
export function formatRutPretty(rut: string): string {
  const cleaned = cleanRut(rut);
  if (cleaned.length <= 1) return cleaned;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);

  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedBody}-${dv}`;
}

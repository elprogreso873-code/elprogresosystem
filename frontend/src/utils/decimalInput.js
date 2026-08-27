/**
 * Utilidades para campos decimales (stock, cantidades).
 * Sin separador de miles — más simple para ingreso rápido.
 */

export const inferDecimalsFromStep = (step) => {
  if (step == null || step === '' || step === 'any') return 0;
  const stepNum = Number(step);
  if (!Number.isFinite(stepNum) || stepNum <= 0) return 3;
  if (Number.isInteger(stepNum)) return 0;
  const stepStr = String(step);
  const dot = stepStr.indexOf('.');
  return dot === -1 ? 0 : stepStr.length - dot - 1;
};

export const numberToDecimalInputString = (
  value,
  { decimals = 3, emptyZero = true } = {}
) => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  if (emptyZero && num === 0) return '';

  if (decimals === 0) return String(Math.round(num));

  const fixed = num.toFixed(decimals);
  const trimmed = fixed.replace(/(\.\d*?[1-9])0+$/u, '$1').replace(/\.0+$/u, '');
  return trimmed;
};

/**
 * Sanitiza texto mientras el usuario escribe (admite "5.", ",5", "12,34").
 */
export const sanitizeDecimalInputString = (input, maxDecimals = 3) => {
  if (input == null) return '';
  let s = String(input).replace(/[^\d.,]/g, '');
  if (!s) return '';

  const sepIdx = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
  if (sepIdx !== -1) {
    const intPart = s.slice(0, sepIdx).replace(/[.,]/g, '');
    const decPart = s.slice(sepIdx + 1).replace(/[.,]/g, '').slice(0, maxDecimals);
    const endsWithSep = s.endsWith(',') || s.endsWith('.');
    if (endsWithSep && !decPart) {
      return `${intPart || '0'}${s[sepIdx]}`;
    }
    return decPart || endsWithSep ? `${intPart || '0'},${decPart}` : intPart;
  }

  return s.replace(/[.,]/g, '');
};

export const parseDecimalInput = (input) => {
  if (input == null || input === '') return null;
  const s = String(input).trim();
  if (!s || s === ',' || s === '.') return null;
  if (/[.,]$/.test(s)) return null;

  const normalized = s.replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
};

export const clampDecimalValue = (value, { min, max } = {}) => {
  if (value == null || Number.isNaN(value)) return value;
  let n = value;
  if (min != null && n < min) n = min;
  if (max != null && n > max) n = max;
  return n;
};

/**
 * Selecciona todo el texto al enfocar. Captura el elemento de forma síncrona
 * porque event.currentTarget es null dentro de requestAnimationFrame (React).
 */
export const selectAllOnFocus = (elementOrEvent) => {
  const el =
    elementOrEvent?.nodeType === 1
      ? elementOrEvent
      : elementOrEvent?.target ?? elementOrEvent?.currentTarget;

  if (!el || typeof el.select !== 'function') return;

  requestAnimationFrame(() => {
    try {
      el.select();
    } catch {
      // El input pudo desmontarse antes del frame
    }
  });
};

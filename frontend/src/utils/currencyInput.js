import { APP_LOCALE } from './formatCurrency.js';

/**
 * Formatea un número al estilo de entrada argentina (1.234,56).
 */
export const numberToCurrencyInputString = (value, { decimals = 2, emptyZero = false } = {}) => {
  if (value === null || value === undefined || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  if (emptyZero && num === 0) return '';

  const fixed =
    decimals > 0
      ? num.toFixed(decimals)
      : String(Math.max(0, Math.round(num)));
  const [intPart, decPart = ''] = fixed.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (decimals === 0) return formattedInt;

  const dec = decPart.padEnd(decimals, '0').slice(0, decimals);
  const trimmed = dec.replace(/0+$/, '');
  if (!trimmed) return formattedInt;
  return `${formattedInt},${trimmed.length < decimals ? trimmed.padEnd(2, '0') : trimmed}`;
};

/**
 * Formatea texto mientras el usuario escribe (solo dígitos, punto miles, coma decimal).
 */
export const formatCurrencyInputString = (input) => {
  if (input == null) return '';
  let s = String(input).replace(/[^\d.,]/g, '');

  if (!s) return '';

  const commaIdx = s.indexOf(',');
  if (commaIdx !== -1) {
    const before = s.slice(0, commaIdx).replace(/,/g, '');
    const after = s.slice(commaIdx + 1).replace(/,/g, '').replace(/\./g, '').slice(0, 2);
    s = `${before},${after}`;
  } else {
    const lastDot = s.lastIndexOf('.');
    if (lastDot !== -1 && s.length - lastDot <= 3) {
      const before = s.slice(0, lastDot).replace(/\./g, '');
      const after = s.slice(lastDot + 1).replace(/\./g, '').slice(0, 2);
      s = after.length ? `${before},${after}` : before;
    }
  }

  const parts = s.split(',');
  let intDigits = parts[0].replace(/\./g, '');

  if (intDigits === '' && parts.length === 1 && !s.includes(',')) {
    return '';
  }

  if (intDigits === '' && s.includes(',')) {
    intDigits = '0';
  }

  intDigits = intDigits.replace(/^0+(?=\d)/, '') || (parts[1] !== undefined || s.endsWith(',') ? '0' : '');

  if (!intDigits && !parts[1] && !s.endsWith(',')) return '';

  const withThousands = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (parts[1] !== undefined || s.endsWith(',')) {
    return `${withThousands},${parts[1] ?? ''}`;
  }

  return withThousands;
};

/**
 * Convierte texto con formato argentino a número.
 */
export const parseCurrencyInput = (input) => {
  if (input == null || input === '') return null;
  const s = String(input).trim();
  if (!s) return null;

  const commaIdx = s.lastIndexOf(',');
  if (commaIdx !== -1) {
    const intPart = s.slice(0, commaIdx).replace(/\./g, '').replace(/\s/g, '');
    const decPart = s.slice(commaIdx + 1).replace(/[^\d]/g, '');
    const num = parseFloat(`${intPart || '0'}.${decPart || '0'}`);
    return Number.isNaN(num) ? null : num;
  }

  const lastDot = s.lastIndexOf('.');
  if (lastDot !== -1 && s.length - lastDot <= 3) {
    const intPart = s.slice(0, lastDot).replace(/\./g, '');
    const decPart = s.slice(lastDot + 1);
    const num = parseFloat(`${intPart || '0'}.${decPart || '0'}`);
    return Number.isNaN(num) ? null : num;
  }

  const digits = s.replace(/\./g, '').replace(/\s/g, '');
  if (!digits) return null;
  const num = parseFloat(digits);
  return Number.isNaN(num) ? null : num;
};

export const clampCurrencyValue = (value, { min, max } = {}) => {
  if (value == null || Number.isNaN(value)) return value;
  let n = value;
  if (min != null && n < min) n = min;
  if (max != null && n > max) n = max;
  return n;
};

/** @deprecated Ya no se muestra en UI */
export const PRICE_INPUT_HINT = '';

/** @deprecated use PRICE_INPUT_HINT */
export const CURRENCY_INPUT_HINT = PRICE_INPUT_HINT;

export const formatCurrencyPreview = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  return new Intl.NumberFormat(APP_LOCALE, {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

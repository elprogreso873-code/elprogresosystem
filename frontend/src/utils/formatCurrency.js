/** Locale y moneda del sistema — peso argentino (ARS) */
export const APP_LOCALE = 'es-AR';
export const APP_CURRENCY = 'ARS';

/** @deprecated Importar desde currencyInput.js */
export { PRICE_INPUT_HINT, CURRENCY_INPUT_HINT } from './currencyInput.js';

const currencyFormatter = new Intl.NumberFormat(APP_LOCALE, {
  style: 'currency',
  currency: APP_CURRENCY,
  currencyDisplay: 'symbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerCurrencyFormatter = new Intl.NumberFormat(APP_LOCALE, {
  style: 'currency',
  currency: APP_CURRENCY,
  currencyDisplay: 'symbol',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatters = new Map();

const getNumberFormatter = (maxDecimals) => {
  if (!numberFormatters.has(maxDecimals)) {
    numberFormatters.set(
      maxDecimals,
      new Intl.NumberFormat(APP_LOCALE, {
        minimumFractionDigits: 0,
        maximumFractionDigits: maxDecimals,
      }),
    );
  }
  return numberFormatters.get(maxDecimals);
};

/**
 * Formatea un monto en pesos argentinos (ej. $ 1.234,56).
 * @param {number|string|null|undefined} value
 * @param {{ withoutDecimals?: boolean }} [options]
 */
export const formatCurrency = (value, options = {}) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  const formatter = options.withoutDecimals
    ? integerCurrencyFormatter
    : currencyFormatter;
  return formatter.format(num);
};

/**
 * Formatea números con separadores argentinos (punto miles, coma decimal).
 * No fuerza decimales innecesarios: 5 → "5", 5.5 → "5,5", 5.25 → "5,25".
 * @param {number|string|null|undefined} value
 * @param {number} [maxDecimals=3] máximo de decimales a mostrar
 */
export const formatNumber = (value, maxDecimals = 3) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  const decimals = Math.max(0, Number(maxDecimals) || 0);
  return getNumberFormatter(decimals).format(num);
};

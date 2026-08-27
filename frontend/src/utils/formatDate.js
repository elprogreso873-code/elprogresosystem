import { APP_LOCALE } from './formatCurrency.js';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MYSQL_DATETIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/;
const ISO_OFFSET_PATTERN = /[Zz]$|[+-]\d{2}:\d{2}$/;

const dateFromParts = (y, m, d, h = 0, min = 0, sec = 0) =>
  new Date(y, m - 1, d, h, min, sec);

/**
 * Solo fecha YYYY-MM-DD → medianoche local (evita desfase al parsear sin hora).
 */
const parseLocalDateOnly = (dateInput) => {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) return null;
    return dateFromParts(
      dateInput.getFullYear(),
      dateInput.getMonth() + 1,
      dateInput.getDate()
    );
  }

  const str = String(dateInput).trim();

  if (DATE_ONLY_PATTERN.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return dateFromParts(y, m, d);
  }

  const dateTime = parseDateTime(dateInput);
  if (!dateTime) return null;
  return dateFromParts(
    dateTime.getFullYear(),
    dateTime.getMonth() + 1,
    dateTime.getDate()
  );
};

/**
 * Fecha y hora completas, respetando zona horaria del valor.
 * - ISO con Z/offset → instante UTC convertido a hora local del navegador
 * - MySQL / ISO sin zona → componentes como hora local
 * - Solo fecha → medianoche local
 */
export const parseDateTime = (dateInput) => {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    return Number.isNaN(dateInput.getTime()) ? null : dateInput;
  }

  const str = String(dateInput).trim();

  if (DATE_ONLY_PATTERN.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return dateFromParts(y, m, d);
  }

  if (ISO_OFFSET_PATTERN.test(str)) {
    const parsed = new Date(str);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const mysql = str.match(MYSQL_DATETIME_PATTERN);
  if (mysql) {
    const [, y, m, d, h, min, sec] = mysql.map(Number);
    return dateFromParts(y, m, d, h, min, sec);
  }

  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/** Fecha y hora en locale del sistema (ej. 9 jun 2026, 08:53) */
export const formatDate = (dateInput) => {
  const date = parseDateTime(dateInput);
  if (!date) return '—';
  return new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

/** Alias de formatDate para fecha+hora */
export const formatDateTime = formatDate;

/** Solo fecha (ej. 3 jun 2026) — ideal para reportes y filtros de período */
export const formatDateOnly = (dateString, options = {}) => {
  const date = parseLocalDateOnly(dateString);
  if (!date) return '—';
  return new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: options.style === 'long' ? 'long' : 'medium',
    ...options,
  }).format(date);
};

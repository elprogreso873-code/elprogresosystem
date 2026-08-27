import { env } from './env';

export const BRAND_NAME = env.appName;

/** Verde oscuro elegante (#1B4332) — RGB para PDF/jsPDF */
export const BRAND_RGB = [27, 67, 50];
export const BRAND_RGB_ON_PRIMARY = [255, 255, 255];
export const BRAND_THEME_HEX = '#1B4332';

const slugify = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const brandFileSlug = (suffix = '') => {
  const base = slugify(BRAND_NAME) || 'El-Progreso';
  const extra = slugify(suffix);
  return extra ? `${base}_${extra}` : base;
};

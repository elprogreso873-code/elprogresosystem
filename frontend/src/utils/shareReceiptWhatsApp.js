import { formatCurrency } from './formatCurrency';
import { downloadBlob, generateReceiptPdfBlob } from './receiptPdf';
import { BRAND_NAME } from '../config/brand';

const tipoNombre = {
  ticket: 'ticket',
  factura: 'factura',
  boleta: 'boleta',
};

const DEFAULT_COUNTRY_CODE = '54';

export const isMobileDevice = () =>
  typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** Datos mínimos del listado para abrir WhatsApp sin esperar la API. */
export const buildQuickReceiptData = (receipt) => ({
  comprobante: {
    numero: receipt.numero,
    tipo: receipt.tipo || 'ticket',
  },
  venta: {
    numero: receipt.venta_numero,
    total: receipt.venta_total,
    cliente_nombre: receipt.cliente_nombre,
  },
});

/**
 * Inserta el "9" de móvil argentino si falta (54 + 10 dígitos → 549 + 10 dígitos).
 */
const fixArgentinaMobilePrefix = (digits) => {
  if (!digits.startsWith('54') || digits.startsWith('549')) return digits;

  const local = digits.slice(2);
  if (local.length === 10) {
    return `549${local}`;
  }

  return digits;
};

/**
 * Quita el prefijo móvil "15" solo en AMBA (11 15 xxxx xxxx).
 * No usar un patrón genérico con "15": números como 3815278529 (Tucumán)
 * contienen "15" en medio y se corromperían.
 */
const stripAmbaMobile15 = (digits) => {
  const amba = digits.match(/^11(15)(\d{8})$/);
  if (amba) return `11${amba[2]}`;
  return digits;
};

/**
 * Normaliza teléfono a formato internacional para WhatsApp (solo dígitos, sin +).
 * Argentina: 54 + 9 + código de área + número (ej. 5493815278529).
 */
export const normalizePhoneForWhatsApp = (phone, defaultCountryCode = DEFAULT_COUNTRY_CODE) => {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('00')) digits = digits.slice(2);

  if (digits.startsWith('549') && digits.length >= 12) {
    return digits;
  }

  if (digits.startsWith('54')) {
    return fixArgentinaMobilePrefix(digits);
  }

  while (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  digits = stripAmbaMobile15(digits);

  // 15 + 8 dígitos sin área (uso común en CABA/GBA)
  if (/^15\d{8}$/.test(digits)) {
    digits = `11${digits.slice(2)}`;
  }

  if (defaultCountryCode && !digits.startsWith(defaultCountryCode)) {
    digits = `${defaultCountryCode}${digits}`;
  }

  return fixArgentinaMobilePrefix(digits);
};

export const buildReceiptWhatsAppMessage = (data, { includeAttachHint = false } = {}) => {
  const { comprobante, venta } = data;
  const tipo = tipoNombre[comprobante.tipo] || 'comprobante';
  const nombre = venta.cliente_nombre || 'cliente';
  const total = formatCurrency(venta.total);

  const lines = [
    `Estimado/a ${nombre},`,
    '',
    `Le saludamos desde *${BRAND_NAME}*.`,
    '',
    `Le enviamos su ${tipo} N° *${comprobante.numero}* correspondiente a la venta *${venta.numero}*, por un total de *${total}*.`,
    '',
    'Ante cualquier consulta, quedamos a disposición.',
    '',
    `— Equipo ${BRAND_NAME}`,
  ];

  if (includeAttachHint) {
    lines.push('', '_Adjunte el comprobante PDF que se descargó en su dispositivo._');
  }

  return lines.join('\n');
};

/**
 * URL oficial (mismo formato que api.whatsapp.com/send/?phone=...&text=...).
 * En PC muestra la página intermedia; en móvil permite abrir la app.
 */
export const buildWhatsAppSendUrl = (phone, message) => {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) {
    throw new Error('Número de teléfono inválido');
  }

  const params = new URLSearchParams();
  params.set('phone', normalized);
  params.set('text', message);

  return `https://api.whatsapp.com/send/?${params.toString()}`;
};

/**
 * Abre URL externa de forma compatible con PWA y bloqueadores de popups.
 * Debe invocarse de forma síncrona dentro del onClick del usuario.
 */
export const openExternalUrl = (url) => {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.referrerPolicy = 'no-referrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

/**
 * Abre WhatsApp con teléfono y mensaje precargados.
 * PC → nueva pestaña con WhatsApp Web / página intermedia.
 * Móvil → navegador o app (sin reemplazar la PWA con location.assign).
 */
export const openWhatsAppChat = (phone, message) => {
  const url = buildWhatsAppSendUrl(phone, message);
  openExternalUrl(url);
};

const resolvePhone = (phone, receiptData) =>
  phone?.trim() || receiptData?.venta?.cliente_telefono?.trim() || '';

export const assertValidWhatsAppPhone = (phone, receiptData = null) => {
  const resolvedPhone = resolvePhone(phone, receiptData);
  if (!resolvedPhone) {
    throw new Error('El cliente no tiene teléfono registrado');
  }

  const normalized = normalizePhoneForWhatsApp(resolvedPhone);
  if (!normalized || normalized.length < 10) {
    throw new Error(
      'El teléfono del cliente no es válido para WhatsApp. Revise el número en la ficha del cliente.'
    );
  }

  return { resolvedPhone, normalized };
};

/** Genera y descarga el PDF del comprobante (puede correr después de abrir WhatsApp). */
export const downloadReceiptPdfForShare = async (receiptData) => {
  assertValidWhatsAppPhone(null, receiptData);
  const { blob, filename } = await generateReceiptPdfBlob(receiptData);
  downloadBlob(blob, filename);
  return { filename };
};

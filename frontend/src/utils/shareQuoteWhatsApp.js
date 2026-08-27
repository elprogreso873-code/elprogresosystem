import { formatCurrency } from './formatCurrency';
import { formatDate } from './formatDate';
import { downloadQuotePdf } from './quotePdf';
import {
  normalizePhoneForWhatsApp,
  openWhatsAppChat,
  assertValidWhatsAppPhone,
} from './shareReceiptWhatsApp';
import { BRAND_NAME } from '../config/brand';

export const buildQuickQuoteData = (quote) => ({
  presupuesto: {
    numero: quote.numero,
    total: quote.total,
    validez_hasta: quote.validez_hasta,
  },
  cliente: {
    nombre: quote.cliente_nombre,
    telefono: quote.cliente_telefono,
  },
});

export const buildQuoteWhatsAppMessage = (data, { includeAttachHint = false } = {}) => {
  const { presupuesto, cliente } = data;
  const nombre = cliente?.nombre || 'cliente';
  const total = formatCurrency(presupuesto.total);
  const validez = presupuesto.validez_hasta
    ? `\nVálido hasta *${formatDate(presupuesto.validez_hasta)}*.`
    : '';

  const lines = [
    `Estimado/a ${nombre},`,
    '',
    `Le saludamos desde *${BRAND_NAME}*.`,
    '',
    `Le enviamos su presupuesto N° *${presupuesto.numero}* por un total de *${total}*.${validez}`,
    '',
    'Ante cualquier consulta, quedamos a disposición.',
    '',
    `— Equipo ${BRAND_NAME}`,
  ];

  if (includeAttachHint) {
    lines.push('', '_Adjunte el PDF del presupuesto que se descargó en su dispositivo._');
  }

  return lines.join('\n');
};

export const downloadQuotePdfForShare = async (quoteData) => {
  await downloadQuotePdf(quoteData);
};

export const shareQuoteViaWhatsApp = async (quote, printData) => {
  if (!quote.cliente_id) {
    throw new Error(
      'Este presupuesto no tiene un cliente vinculado. No es posible enviarlo por WhatsApp.'
    );
  }

  if (!quote.cliente_telefono?.trim()) {
    throw new Error(
      `${quote.cliente_nombre || 'El cliente'} no tiene teléfono registrado. Agregue el número para enviar el presupuesto por WhatsApp.`
    );
  }

  assertValidWhatsAppPhone(quote.cliente_telefono);

  const quickData = buildQuickQuoteData(quote);
  const message = buildQuoteWhatsAppMessage(quickData, { includeAttachHint: true });

  openWhatsAppChat(quote.cliente_telefono, message);

  const data = printData || quote;
  if (data.presupuesto && data.detalle) {
    await downloadQuotePdfForShare(data);
  }
};

import { formatCurrency } from './formatCurrency';
import { formatDate } from './formatDate';
import { METODO_PAGO_LABELS } from '../constants/permissions';
import {
  buildCommercialLineRows,
  COMMERCIAL_LINE_HEAD,
  commercialLineColumnStyles,
} from './commercialPdfLines';
import { BRAND_NAME, BRAND_RGB, BRAND_RGB_ON_PRIMARY, brandFileSlug } from '../config/brand';

const tipoLabel = { ticket: 'TICKET', factura: 'FACTURA', boleta: 'BOLETA' };

const safeFilename = (numero) =>
  `${brandFileSlug()}_${String(numero).replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

export const generateReceiptPdfBlob = async (data) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const { comprobante, venta, detalle } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 14;
  let y = margin;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(BRAND_NAME, margin, y);

  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(tipoLabel[comprobante.tipo] || 'COMPROBANTE', margin, y);

  y += 6;
  doc.setTextColor(0);
  doc.setFont('courier', 'bold');
  doc.text(comprobante.numero, margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(formatDate(comprobante.fecha_emision), margin, y);
  doc.setTextColor(0);

  y += 8;
  const infoLines = [
    ['Venta:', venta.numero],
    ['Cliente:', venta.cliente_nombre || 'Consumidor final'],
    ...(venta.numero_documento
      ? [['Documento:', `${venta.tipo_documento} ${venta.numero_documento}`]]
      : []),
    ['Vendedor:', venta.vendedor],
    [
      'Pago:',
      venta.metodo_pago_nombre || METODO_PAGO_LABELS[venta.metodo_pago] || venta.metodo_pago,
    ],
  ];

  infoLines.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 24, y);
    y += 5;
  });

  if (venta.pagos?.length > 1) {
    venta.pagos.forEach((pago) => {
      doc.setFont('helvetica', 'normal');
      doc.text(
        `  · ${pago.metodo_pago_nombre}: ${formatCurrency(pago.monto)}`,
        margin,
        y
      );
      y += 5;
    });
  }

  y += 2;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [COMMERCIAL_LINE_HEAD],
    body: buildCommercialLineRows(detalle),
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: BRAND_RGB, textColor: BRAND_RGB_ON_PRIMARY },
    columnStyles: {
      0: { cellWidth: 'auto' },
      ...commercialLineColumnStyles,
    },
  });

  y = doc.lastAutoTable.finalY + 8;
  const rightX = 210 - margin;

  const totals = [
    ['Subtotal', formatCurrency(venta.subtotal)],
    ['Descuento', `-${formatCurrency(venta.descuento)}`],
    ['TOTAL', formatCurrency(venta.total)],
  ];

  totals.forEach(([label, value], index) => {
    const isTotal = index === totals.length - 1;
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    doc.setFontSize(isTotal ? 12 : 10);
    doc.text(label, margin, y);
    doc.text(value, rightX, y, { align: 'right' });
    y += isTotal ? 7 : 5;
  });

  if (venta.monto_recibido != null) {
    y += 2;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Recibido: ${formatCurrency(venta.monto_recibido)}`, margin, y);
    y += 5;
    doc.text(`Vuelto: ${formatCurrency(venta.vuelto ?? 0)}`, margin, y);
  }

  if (venta.estado === 'anulada') {
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('COMPROBANTE ANULADO', 105, y, { align: 'center' });
    doc.setTextColor(0);
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Gracias por su compra — ${BRAND_NAME}`, 105, 285, { align: 'center' });

  const filename = safeFilename(comprobante.numero);
  const blob = doc.output('blob');
  return { blob, filename };
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

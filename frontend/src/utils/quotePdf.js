import { formatCurrency } from './formatCurrency';
import { formatDate } from './formatDate';
import {
  buildCommercialLineRows,
  COMMERCIAL_LINE_HEAD,
  commercialLineColumnStyles,
} from './commercialPdfLines';
import { BRAND_NAME, BRAND_RGB, BRAND_RGB_ON_PRIMARY, brandFileSlug } from '../config/brand';

const safeFilename = (numero) =>
  `${brandFileSlug('Presupuesto')}_${String(numero).replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

export const generateQuotePdfBlob = async (data) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const { presupuesto, cliente, vendedor, detalle } = data;
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
  doc.text('PRESUPUESTO', margin, y);

  y += 6;
  doc.setTextColor(0);
  doc.setFont('courier', 'bold');
  doc.text(presupuesto.numero, margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(formatDate(presupuesto.fecha_presupuesto), margin, y);
  if (presupuesto.validez_hasta) {
    y += 4;
    doc.setTextColor(180, 120, 0);
    doc.text(`Válido hasta ${formatDate(presupuesto.validez_hasta)}`, margin, y);
  }
  doc.setTextColor(0);

  y += 8;
  const infoLines = [
    ['Cliente:', cliente?.nombre || 'Consumidor final'],
    ...(cliente?.numero_documento
      ? [['Documento:', `${cliente.tipo_documento} ${cliente.numero_documento}`]]
      : []),
    ['Vendedor:', vendedor],
  ];

  infoLines.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), margin + 24, y);
    y += 5;
  });

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
    ['Subtotal', formatCurrency(presupuesto.subtotal)],
    ['Descuento', `-${formatCurrency(presupuesto.descuento)}`],
    ['TOTAL', formatCurrency(presupuesto.total)],
  ];

  totals.forEach(([label, value], index) => {
    const isTotal = index === totals.length - 1;
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    doc.setFontSize(isTotal ? 12 : 10);
    doc.text(label, margin, y);
    doc.text(value, rightX, y, { align: 'right' });
    y += isTotal ? 7 : 5;
  });

  if (presupuesto.observaciones) {
    y += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones:', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(presupuesto.observaciones, 182);
    doc.text(lines, margin, y);
    y += lines.length * 4;
  }

  if (presupuesto.estado === 'anulado') {
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('PRESUPUESTO ANULADO', 105, y, { align: 'center' });
    doc.setTextColor(0);
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Documento no válido como comprobante fiscal — ${BRAND_NAME}`, 105, 285, {
    align: 'center',
  });

  const filename = safeFilename(presupuesto.numero);
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

export const downloadQuotePdf = async (data) => {
  const { blob, filename } = await generateQuotePdfBlob(data);
  downloadBlob(blob, filename);
  return { filename };
};

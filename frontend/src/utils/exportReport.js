import { formatCurrency, formatNumber } from './formatCurrency';
import { formatDateOnly, formatDateTime } from './formatDate';
import { BRAND_NAME, BRAND_RGB, BRAND_RGB_ON_PRIMARY, brandFileSlug } from '../config/brand';

const fileStamp = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
};

const buildFilename = (fechaDesde, fechaHasta, ext) =>
  `${brandFileSlug('reporte').toLowerCase()}_${fechaDesde}_${fechaHasta}_${fileStamp()}.${ext}`;

export const exportReportExcel = async ({
  fechaDesde,
  fechaHasta,
  dashboard,
  salesByDay,
  topProducts,
  salesByUser,
  lowStock,
}) => {
  const XLSX = await import('xlsx');

  const resumen = [
    [`${BRAND_NAME} — Reporte de ventas`],
    ['Período', `${fechaDesde} al ${fechaHasta}`],
    ['Generado', formatDateTime(new Date())],
    [],
    ['Indicador', 'Valor'],
    ['Ingresos del período', dashboard.ventas.ingresos],
    ['Cantidad de ventas', dashboard.ventas.cantidad],
    ['Ticket promedio', dashboard.ventas.ticket_promedio],
    ['Ventas anuladas', dashboard.ventas.anuladas],
    ['Productos con stock bajo', dashboard.inventario.productos_stock_bajo],
  ];

  const porMetodo = [
    ['Método de pago', 'Operaciones', 'Total'],
    ...(dashboard.por_metodo_pago || []).map((m) => [
      m.metodo_pago_nombre || m.metodo_pago,
      m.cantidad,
      m.total,
    ]),
  ];

  const ventasDia = [
    ['Fecha', 'Cantidad', 'Total'],
    ...salesByDay.map((d) => [d.fecha, d.cantidad, d.total]),
  ];

  const topProd = [
    ['#', 'Producto', 'Código', 'Unidades', 'Ingresos'],
    ...topProducts.map((p, i) => [
      i + 1,
      p.producto_nombre,
      p.producto_codigo,
      p.cantidad_vendida,
      p.ingresos,
    ]),
  ];

  const porVendedor = [
    ['Vendedor', 'Ventas', 'Total'],
    ...salesByUser.map((u) => [u.nombre_usuario, u.cantidad, u.total]),
  ];

  const stockBajo = [
    ['Producto', 'Código', 'Stock', 'Mínimo', 'Unidad', 'Categoría'],
    ...lowStock.map((p) => [
      p.nombre,
      p.codigo,
      p.stock,
      p.stock_minimo,
      p.unidad_medida,
      p.categoria_nombre || '',
    ]),
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(resumen), 'Resumen');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(porMetodo), 'Por método pago');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(ventasDia), 'Ventas por día');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(topProd), 'Top productos');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(porVendedor), 'Por vendedor');
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(stockBajo), 'Stock bajo');

  XLSX.writeFile(workbook, buildFilename(fechaDesde, fechaHasta, 'xlsx'));
};

export const exportReportPdf = async ({
  fechaDesde,
  fechaHasta,
  dashboard,
  salesByDay,
  topProducts,
  salesByUser,
  lowStock,
}) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 14;
  let y = margin;

  doc.setFontSize(16);
  doc.text(`${BRAND_NAME} — Reporte`, margin, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(`Período: ${fechaDesde} al ${fechaHasta}`, margin, y);
  y += 5;
  doc.text(`Generado: ${formatDateTime(new Date())}`, margin, y);
  y += 8;
  doc.setTextColor(0);

  autoTable(doc, {
    startY: y,
    head: [['Indicador', 'Valor']],
    body: [
      ['Ingresos', formatCurrency(dashboard.ventas.ingresos)],
      ['Ventas completadas', String(dashboard.ventas.cantidad)],
      ['Ticket promedio', formatCurrency(dashboard.ventas.ticket_promedio)],
      ['Ventas anuladas', String(dashboard.ventas.anuladas)],
      ['Stock bajo', String(dashboard.inventario.productos_stock_bajo)],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: BRAND_RGB, textColor: BRAND_RGB_ON_PRIMARY },
  });

  y = doc.lastAutoTable.finalY + 8;

  if (salesByDay.length > 0) {
    doc.setFontSize(12);
    doc.text('Ventas por día', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Cant.', 'Total']],
      body: salesByDay.map((d) => [
        formatDateOnly(d.fecha),
        String(d.cantidad),
        formatCurrency(d.total),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 65, 85] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (topProducts.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(12);
    doc.text('Top productos', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Producto', 'Uds.', 'Ingresos']],
      body: topProducts.map((p) => [
        p.producto_nombre,
        formatNumber(p.cantidad_vendida, 2),
        formatCurrency(p.ingresos),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 65, 85] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (salesByUser.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = margin;
    }
    doc.setFontSize(12);
    doc.text('Ventas por vendedor', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Vendedor', 'Ventas', 'Total']],
      body: salesByUser.map((u) => [
        u.nombre_usuario,
        String(u.cantidad),
        formatCurrency(u.total),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 65, 85] },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  if (lowStock.length > 0) {
    doc.addPage();
    y = margin;
    doc.setFontSize(12);
    doc.text('Alertas de stock bajo', margin, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Producto', 'Stock', 'Mínimo']],
      body: lowStock.map((p) => [
        p.nombre,
        formatNumber(p.stock, 2),
        formatNumber(p.stock_minimo, 2),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] },
    });
  }

  doc.save(buildFilename(fechaDesde, fechaHasta, 'pdf'));
};

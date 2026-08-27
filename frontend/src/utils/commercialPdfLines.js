import { formatCurrency } from './formatCurrency';
import { formatQuantityDisplay } from './productPricing';

/**
 * Filas de detalle para PDF / impresión comercial.
 * Columnas: Producto | Cantidad | P. unit. | Total
 */
export const buildCommercialLineRows = (detalle = []) =>
  (detalle || []).map((line) => {
    const qty = formatQuantityDisplay(line);

    const nameParts = [line.producto_nombre || 'Producto'];
    if (line.producto_codigo) nameParts.push(String(line.producto_codigo));
    if (Number(line.descuento) > 0) {
      nameParts.push(`Desc. −${formatCurrency(line.descuento)}`);
    }

    return [
      nameParts.join('\n'),
      qty.compact,
      formatCurrency(line.precio_unitario),
      formatCurrency(line.subtotal),
    ];
  });

export const COMMERCIAL_LINE_HEAD = ['Producto', 'Cantidad', 'P. unit.', 'Total'];

export const commercialLineColumnStyles = {
  1: { halign: 'right', cellWidth: 42 },
  2: { halign: 'right', cellWidth: 28 },
  3: { halign: 'right', cellWidth: 28 },
};

/** Estado de navegación para convertir un presupuesto vigente en venta */
export const buildQuoteToSaleState = (presupuesto) => {
  if (!presupuesto?.detalle?.length) return null;

  return {
    convertFrom: {
      presupuesto_id: presupuesto.id,
      presupuesto_numero: presupuesto.numero,
      cliente_id: presupuesto.cliente_id ? String(presupuesto.cliente_id) : '',
      observaciones: presupuesto.observaciones || '',
      descuento: presupuesto.descuento ?? 0,
      items: presupuesto.detalle.map((line) => ({
        producto_id: line.producto_id,
        codigo: line.producto_codigo,
        nombre: line.producto_nombre,
        modo_venta: line.modo_venta ?? 'suelto',
        precio_unitario: line.precio_unitario,
        cantidad: line.cantidad,
        descuento: line.descuento ?? 0,
        stock: null,
      })),
    },
    message: `Convirtiendo presupuesto ${presupuesto.numero}. Registre el pago para completar la venta.`,
  };
};

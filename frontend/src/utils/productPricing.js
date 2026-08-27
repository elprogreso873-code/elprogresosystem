import { formatCurrency, formatNumber } from './formatCurrency';

export const MODOS_VENTA = {
  SUELTO: 'suelto',
  PAQUETE: 'paquete',
};

export const MODO_VENTA_LABELS = {
  suelto: 'Suelto',
  paquete: 'Paquete',
};

export const hasPaquetePricing = (product) =>
  product != null &&
  product.precio_venta_paquete != null &&
  Number(product.precio_venta_paquete) > 0 &&
  Number(product.unidades_por_paquete) > 0;

export const cartLineKey = (productoId, modoVenta = MODOS_VENTA.SUELTO) =>
  `${productoId}:${modoVenta}`;

export const getPrecioForModo = (product, modoVenta) =>
  modoVenta === MODOS_VENTA.PAQUETE
    ? Number(product.precio_venta_paquete)
    : Number(product.precio_venta);

export const getInventoryQty = (item) => {
  if (item.cantidad_inventario != null && item.cantidad_inventario !== '') {
    return Number(item.cantidad_inventario);
  }
  if (item.modo_venta === MODOS_VENTA.PAQUETE) {
    return Number(item.cantidad) * Number(item.unidades_por_paquete || 1);
  }
  return Number(item.cantidad);
};

export const getCantidadLabel = (item) =>
  item.modo_venta === MODOS_VENTA.PAQUETE ? 'Paquetes' : item.unidad_medida || 'uds';

export const formatPaqueteHint = (product) => {
  if (!hasPaquetePricing(product)) return null;
  const units = formatNumber(product.unidades_por_paquete, 3);
  const unit = product.unidad_medida || 'uds';
  return `1 paq. = ${units} ${unit}`;
};

/**
 * Texto claro de cantidad + tipo (suelto/paquete) para UI, PDF e impresión.
 * Ej: "1 paquete (20 uds)" o "5 uds"
 */
export const formatQuantityDisplay = (line, options = {}) => {
  const baseUnit = options.unitLabel || line.unidad_medida || 'uds';
  const qty = Number(line.cantidad);
  const modo = line.modo_venta === MODOS_VENTA.PAQUETE ? MODOS_VENTA.PAQUETE : MODOS_VENTA.SUELTO;
  const qtyText = formatNumber(qty, 3);

  const pluralizeUnit = (n, unit) => {
    const u = String(unit || 'uds').trim();
    if (!u) return 'uds';
    if (Math.abs(n) === 1) {
      if (u === 'unidades') return 'unidad';
      if (u === 'uds') return 'ud';
      return u;
    }
    if (u === 'unidad') return 'unidades';
    if (u === 'ud') return 'uds';
    return u;
  };

  if (modo === MODOS_VENTA.PAQUETE) {
    const inventory = getInventoryQty(line);
    const invText = formatNumber(inventory, 3);
    const packWord = Math.abs(qty) === 1 ? 'paquete' : 'paquetes';
    const unitWord = pluralizeUnit(inventory, baseUnit);
    return {
      modo,
      primary: `${qtyText} ${packWord}`,
      secondary: `(${invText} ${unitWord})`,
      compact: `${qtyText} ${packWord} (${invText} ${unitWord})`,
      modoLabel: MODO_VENTA_LABELS.paquete,
    };
  }

  const unitWord = pluralizeUnit(qty, baseUnit);
  return {
    modo,
    primary: qtyText,
    secondary: unitWord,
    compact: `${qtyText} ${unitWord}`,
    modoLabel: MODO_VENTA_LABELS.suelto,
  };
};

/** Texto corto para listados de catálogo: "1 paq. = 20 uds" */
export const formatProductPackageBadge = (product) => {
  if (!hasPaquetePricing(product)) return null;
  const units = formatNumber(product.unidades_por_paquete, 3);
  const unit = product.unidad_medida || 'uds';
  const unitWord =
    Math.abs(Number(product.unidades_por_paquete)) === 1
      ? unit === 'unidades'
        ? 'unidad'
        : unit === 'uds'
          ? 'ud'
          : unit
      : unit === 'unidad'
        ? 'unidades'
        : unit === 'ud'
          ? 'uds'
          : unit;
  return `1 paq. = ${units} ${unitWord}`;
};

export const formatPrecioResumen = (product, modoVenta) => {
  if (modoVenta === MODOS_VENTA.PAQUETE) {
    return `${formatCurrency(product.precio_venta_paquete)} / paq.`;
  }
  const unit = product.unidad_medida || 'ud';
  return `${formatCurrency(product.precio_venta)} / ${unit}`;
};

export const buildCartLine = (product, modoVenta = MODOS_VENTA.SUELTO) => ({
  lineKey: cartLineKey(product.id, modoVenta),
  producto_id: product.id,
  modo_venta: modoVenta,
  codigo: product.codigo,
  nombre: product.nombre,
  imagen_url: product.imagen_url,
  color: product.color,
  talle: product.talle,
  stock: product.stock,
  unidad_medida: product.unidad_medida,
  precio_venta: product.precio_venta,
  precio_venta_paquete: product.precio_venta_paquete ?? null,
  unidades_por_paquete: product.unidades_por_paquete ?? 1,
  tiene_precio_paquete: hasPaquetePricing(product),
  precio_unitario: getPrecioForModo(product, modoVenta),
  cantidad: 1,
  descuento: 0,
});

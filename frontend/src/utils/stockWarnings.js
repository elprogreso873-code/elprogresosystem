import { formatNumber } from './formatCurrency';
import { getInventoryQty } from './productPricing';

const unitLabel = (product) => product?.unidad_medida || 'uds';

/**
 * Mensaje de advertencia al agregar o aumentar cantidad en una venta.
 * @returns {string|null}
 */
export const getStockAddWarning = (product, quantityInCart) => {
  const stock = Number(product?.stock ?? 0);
  const qtyInStock =
    product?.modo_venta != null
      ? getInventoryQty({ ...product, cantidad: quantityInCart })
      : Number(quantityInCart);
  const qty = Number(qtyInStock);
  if (!Number.isFinite(qty) || qty <= 0) return null;

  const remaining = stock - qty;
  const name = product?.nombre || 'Producto';
  const unit = unitLabel(product);

  if (stock <= 0) {
    return `«${name}» no tiene stock. Al vender ${formatNumber(qty, 2)} ${unit} el inventario quedará en ${formatNumber(remaining, 2)}.`;
  }

  if (remaining < 0) {
    return `«${name}» tiene ${formatNumber(stock, 2)} ${unit} en stock. Al vender ${formatNumber(qty, 2)} quedará en ${formatNumber(remaining, 2)}.`;
  }

  return null;
};

export const hasNoStock = (product) => Number(product?.stock ?? 0) <= 0;

export const isStockNegative = (product) => Number(product?.stock ?? 0) < 0;

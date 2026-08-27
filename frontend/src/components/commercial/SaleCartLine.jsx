import { useState } from 'react';
import { Trash2, Minus, Plus, ChevronDown, ChevronUp, AlertTriangle, Package, Layers } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import { getStockAddWarning } from '../../utils/stockWarnings';
import {
  MODOS_VENTA,
  MODO_VENTA_LABELS,
  getCantidadLabel,
  getInventoryQty,
  getPrecioForModo,
} from '../../utils/productPricing';
import { CurrencyInput } from '../ui/CurrencyInput';
import { DecimalInput } from '../ui/DecimalInput';
import { ProductImage } from '../catalog/ProductImage';
import { ProductMetaChips } from '../catalog/ProductMetaChips';

const roundQty = (n, step = 0.001) => Math.round(n / step) * step;

export const SaleCartLine = ({ item, onUpdate, onRemove, onModoChange, readOnly = false }) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const lineTotal = item.precio_unitario * item.cantidad - (item.descuento || 0);
  const stockWarning = getStockAddWarning(item, item.cantidad);
  const stock = Number(item.stock ?? 0);
  const inventoryQty = getInventoryQty(item);
  const cantidadLabel = getCantidadLabel(item);
  const canToggleModo = item.tiene_precio_paquete;

  const changeQty = (delta) => {
    const next = Math.max(0.001, roundQty(item.cantidad + delta, 0.001));
    onUpdate(item.lineKey, 'cantidad', next);
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="p-3 sm:p-4">
        <div className="flex gap-3 items-start">
          <ProductImage src={item.imagen_url} alt={item.nombre} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 leading-snug">{item.nombre}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{item.codigo}</p>
            <ProductMetaChips color={item.color} talle={item.talle} className="mt-1" />
            <p
              className={`text-xs mt-1 ${
                stock <= 0 ? 'text-red-600 font-medium' : stockWarning ? 'text-amber-700' : 'text-slate-400'
              }`}
            >
              Stock: {formatNumber(stock, 2)} {item.unidad_medida || 'uds'}
              {stock < 0 ? ' (negativo)' : stock <= 0 ? ' (sin stock)' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.lineKey)}
            disabled={readOnly}
            className={`shrink-0 p-2.5 -mr-1 text-red-600 hover:bg-red-50 rounded-xl touch-manipulation ${readOnly ? 'hidden' : ''}`}
            aria-label={`Quitar ${item.nombre}`}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {canToggleModo && !readOnly && (
          <div className="mt-3 inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onModoChange(item.lineKey, MODOS_VENTA.SUELTO)}
              className={`flex-1 px-2 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-1 ${
                item.modo_venta === MODOS_VENTA.SUELTO
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Suelto
            </button>
            <button
              type="button"
              onClick={() => onModoChange(item.lineKey, MODOS_VENTA.PAQUETE)}
              className={`flex-1 px-2 py-2 rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-1 ${
                item.modo_venta === MODOS_VENTA.PAQUETE
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Paquete
            </button>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span className="font-medium text-brand-700">
            {formatCurrency(item.precio_unitario)}
            {item.modo_venta === MODOS_VENTA.PAQUETE ? ' / paq.' : ` / ${item.unidad_medida || 'ud'}`}
          </span>
          {item.modo_venta === MODOS_VENTA.PAQUETE && (
            <span>
              1 paq. = {formatNumber(item.unidades_por_paquete, 0)} {item.unidad_medida || 'uds'}
            </span>
          )}
          {!canToggleModo && (
            <span className="text-slate-400">{MODO_VENTA_LABELS[item.modo_venta] || 'Suelto'}</span>
          )}
        </div>

        {stockWarning && (
          <div className="mt-2 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{stockWarning}</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1 font-medium">
              {cantidadLabel}
            </p>
            {readOnly ? (
              <p className="text-base font-semibold tabular-nums py-2">{formatNumber(item.cantidad, 3)}</p>
            ) : (
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => changeQty(-1)}
                className="p-3 text-slate-700 hover:bg-slate-100 rounded-l-xl touch-manipulation active:bg-slate-200"
                aria-label="Menos cantidad"
              >
                <Minus className="w-5 h-5" />
              </button>
              <label className="sr-only" htmlFor={`qty-${item.lineKey}`}>
                Cantidad
              </label>
              <DecimalInput
                bare
                id={`qty-${item.lineKey}`}
                min={0.001}
                step="0.001"
                decimals={3}
                emptyZero={false}
                fallbackOnBlur={1}
                value={item.cantidad}
                onChange={(v) => onUpdate(item.lineKey, 'cantidad', v)}
                className="w-16 sm:w-20 text-center text-base font-semibold bg-transparent border-x border-slate-200 py-3 tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-400/50"
              />
              <button
                type="button"
                onClick={() => changeQty(1)}
                className="p-3 text-slate-700 hover:bg-slate-100 rounded-r-xl touch-manipulation active:bg-slate-200"
                aria-label="Más cantidad"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            )}
            {item.modo_venta === MODOS_VENTA.PAQUETE && (
              <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
                {formatNumber(item.cantidad, 3)}{' '}
                {Number(item.cantidad) === 1 ? 'paquete' : 'paquetes'} (
                {formatNumber(inventoryQty, 3)} {item.unidad_medida || 'uds'} en stock)
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-500">Subtotal</p>
            <p className="text-lg font-bold text-brand-700 tabular-nums">
              {formatCurrency(lineTotal)}
            </p>
          </div>
        </div>

        {!readOnly && (
        <button
          type="button"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="mt-3 w-full flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 py-1 touch-manipulation"
        >
          {advancedOpen ? (
            <>
              Ocultar precio y descuento <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Ajustar precio o descuento <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
        )}
      </div>

      {advancedOpen && !readOnly && (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0 grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/80">
          <CurrencyInput
            label="Precio u."
            size="md"
            value={item.precio_unitario}
            onChange={(v) => onUpdate(item.lineKey, 'precio_unitario', v ?? 0)}
          />
          <CurrencyInput
            label="Descuento"
            size="md"
            value={item.descuento ?? 0}
            onChange={(v) => onUpdate(item.lineKey, 'descuento', v ?? 0)}
          />
        </div>
      )}
    </article>
  );
};

export const applyModoToCartLine = (item, newModo) => {
  const productLike = {
    precio_venta: item.precio_venta,
    precio_venta_paquete: item.precio_venta_paquete,
    unidades_por_paquete: item.unidades_por_paquete,
  };
  return {
    ...item,
    lineKey: `${item.producto_id}:${newModo}`,
    modo_venta: newModo,
    precio_unitario: getPrecioForModo(productLike, newModo),
    cantidad: 1,
  };
};

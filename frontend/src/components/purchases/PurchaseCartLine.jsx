import { Trash2 } from 'lucide-react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { DecimalInput } from '../ui/DecimalInput';
import { formatCurrency } from '../../utils/formatCurrency';
import { ProductImage } from '../catalog/ProductImage';

export const PurchaseCartLine = ({
  item,
  onUpdate,
  onRemove,
  highlighted = false,
}) => {
  const lineTotal = Number(item.precio_costo || 0) * Number(item.cantidad || 0);

  return (
    <article
      className={`rounded-2xl border overflow-hidden shadow-sm transition-colors duration-300 ${
        highlighted
          ? 'border-brand-400 bg-brand-50/70 ring-2 ring-brand-400/40'
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="p-3 sm:p-4 space-y-3">
        <div className="flex gap-3 items-start">
          <ProductImage src={item.imagen_url} alt={item.nombre} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 leading-snug">{item.nombre}</p>
            {item.codigo ? (
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{item.codigo}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.lineKey)}
            className="shrink-0 p-2.5 -mr-1 text-red-600 hover:bg-red-50 rounded-xl"
            aria-label={`Quitar ${item.nombre}`}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DecimalInput
            id={`qty-${item.lineKey}`}
            label="Cantidad"
            size="md"
            min={0.001}
            value={item.cantidad}
            onChange={(v) => onUpdate(item.lineKey, 'cantidad', v || 0)}
          />
          <CurrencyInput
            id={`costo-${item.lineKey}`}
            label="Costo"
            size="md"
            value={item.precio_costo}
            onChange={(v) => onUpdate(item.lineKey, 'precio_costo', v ?? 0)}
          />
        </div>

        <CurrencyInput
          id={`venta-${item.lineKey}`}
          label="Precio de venta"
          size="md"
          hint="Opcional — si actualiza precios"
          value={item.precio_venta}
          onChange={(v) => onUpdate(item.lineKey, 'precio_venta', v ?? 0)}
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={Boolean(item.actualizar_precios)}
            onChange={(e) => onUpdate(item.lineKey, 'actualizar_precios', e.target.checked)}
          />
          Actualizar precios del producto
        </label>

        <div className="flex justify-between text-sm pt-1 border-t border-slate-100">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-semibold tabular-nums">{formatCurrency(lineTotal)}</span>
        </div>
      </div>
    </article>
  );
};

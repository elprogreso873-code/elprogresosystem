import { Layers, Package } from 'lucide-react';
import { ProductImage } from './ProductImage';
import { ProductMetaChips } from './ProductMetaChips';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  hasPaquetePricing,
  formatPaqueteHint,
  formatPrecioResumen,
  MODOS_VENTA,
} from '../../utils/productPricing';

const cardShellClass =
  'w-full flex items-center gap-3 p-3 sm:p-4 rounded-2xl border border-slate-200 bg-white text-left transition-all';

const imageSubtitle = (product) =>
  [product.codigo, product.color, product.talle].filter(Boolean).join(' · ');

const ProductDetails = ({ product, priceLabel, footer, dualPricing, onAddWithMode }) => (
  <>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-slate-800 leading-tight truncate">{product.nombre}</p>
      {product.codigo ? (
        <p className="text-xs text-slate-500 mt-0.5 font-mono">{product.codigo}</p>
      ) : null}
      <ProductMetaChips color={product.color} talle={product.talle} className="mt-1.5" />
      {footer}
    </div>
    {dualPricing ? (
      <div className="shrink-0 flex flex-col gap-1.5 min-w-[7.5rem]">
        <button
          type="button"
          onClick={() => onAddWithMode?.(product, MODOS_VENTA.SUELTO)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-left hover:border-brand-400 hover:bg-brand-50/50 transition-colors touch-manipulation"
        >
          <span className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-medium">
            <Layers className="w-3 h-3" />
            Suelto
          </span>
          <span className="block font-bold text-brand-700 tabular-nums text-sm mt-0.5">
            {formatPrecioResumen(product, MODOS_VENTA.SUELTO)}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onAddWithMode?.(product, MODOS_VENTA.PAQUETE)}
          className="rounded-xl border border-brand-200 bg-brand-50/40 px-2.5 py-2 text-left hover:border-brand-400 hover:bg-brand-50 transition-colors touch-manipulation"
        >
          <span className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-medium">
            <Package className="w-3 h-3" />
            Paquete
          </span>
          <span className="block font-bold text-brand-700 tabular-nums text-sm mt-0.5">
            {formatCurrency(product.precio_venta_paquete)}
          </span>
          {formatPaqueteHint(product) && (
            <span className="block text-[10px] text-slate-500 mt-0.5">
              {formatPaqueteHint(product)}
            </span>
          )}
        </button>
      </div>
    ) : (
      <div className="shrink-0 text-right pl-2 min-w-[5.5rem]">
        {priceLabel && (
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">{priceLabel}</p>
        )}
        <p className="font-bold text-brand-700 tabular-nums text-base sm:text-lg">
          {formatCurrency(product.precio_venta)}
        </p>
      </div>
    )}
  </>
);

export const ProductSearchCard = ({
  product,
  onClick,
  onAddWithMode,
  disabled = false,
  priceLabel,
  footer,
  className = '',
}) => {
  const dualPricing = hasPaquetePricing(product) && Boolean(onAddWithMode);
  const imageProps = {
    src: product.imagen_url,
    alt: product.nombre,
    size: 'sm',
    enlargeable: !!product.imagen_url,
    enlargeSubtitle: imageSubtitle(product),
  };

  if (dualPricing) {
    return (
      <div
        className={`${cardShellClass} ${
          disabled ? 'opacity-50' : 'hover:border-brand-300'
        } ${className}`}
      >
        <ProductImage {...imageProps} />
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <ProductDetails
            product={product}
            priceLabel={priceLabel}
            footer={footer}
            dualPricing
            onAddWithMode={disabled ? undefined : onAddWithMode}
          />
        </div>
      </div>
    );
  }

  if (onClick) {
    return (
      <div
        className={`${cardShellClass} ${
          disabled ? 'opacity-50' : 'hover:border-brand-400 hover:bg-brand-50/40'
        } ${className}`}
      >
        <ProductImage {...imageProps} />
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="flex-1 flex items-center gap-3 min-w-0 text-left touch-manipulation active:scale-[0.99] disabled:pointer-events-none"
        >
          <ProductDetails product={product} priceLabel={priceLabel} footer={footer} />
        </button>
      </div>
    );
  }

  return (
    <article
      className={`${cardShellClass} hover:border-brand-300 hover:shadow-md ${className}`}
    >
      <ProductImage {...imageProps} />
      <ProductDetails product={product} priceLabel={priceLabel} footer={footer} />
    </article>
  );
};

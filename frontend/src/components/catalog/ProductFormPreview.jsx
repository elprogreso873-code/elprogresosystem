import { Eye, ShoppingBag, LayoutList } from 'lucide-react';
import { ProductImage } from './ProductImage';
import { ProductMetaChips } from './ProductMetaChips';
import { Badge } from '../ui/Badge';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';

export const ProductFormPreview = ({ product, categoryName }) => {
  const {
    nombre,
    codigo,
    imagen_url,
    color,
    talle,
    precio_venta,
    venta_por_paquete,
    precio_venta_paquete,
    unidades_por_paquete,
    stock,
    stock_minimo,
    unidad_medida,
    estado,
  } = product;

  const displayName = nombre?.trim() || 'Nombre del producto';
  const displayCode = codigo?.trim() || null;
  const price = Number(precio_venta) || 0;
  const stockNum = Number(stock) || 0;
  const stockMin = Number(stock_minimo) || 0;
  const stockBajo = stockNum > 0 && stockNum <= stockMin;
  const sinStock = stockNum <= 0;

  const previewProduct = {
    nombre: displayName,
    codigo: displayCode,
    imagen_url: imagen_url || null,
    color: color || null,
    talle: talle || null,
    precio_venta: price,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Eye className="w-4 h-4 text-brand-600" />
        Vista previa en vivo
      </div>

      <div className="rounded-2xl border border-brand-200/80 bg-gradient-to-br from-slate-50 to-brand-50/30 p-4 space-y-4">
        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            En ventas / dashboard
          </p>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-sm">
            <ProductImage src={previewProduct.imagen_url} alt={displayName} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm truncate">{displayName}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {displayCode || <span className="text-slate-400 italic font-sans">Sin código</span>}
              </p>
              <ProductMetaChips color={color} talle={talle} className="mt-1.5" />
              <p className="text-[11px] text-slate-400 mt-1.5">
                Stock {formatNumber(stockNum, 0)}
                {sinStock ? ' · Sin stock' : stockBajo ? ' · Bajo' : ''}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-brand-700 tabular-nums text-sm">
                {formatCurrency(price)}
              </p>
              {venta_por_paquete && Number(precio_venta_paquete) > 0 && (
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Paq. {formatCurrency(precio_venta_paquete)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <LayoutList className="w-3.5 h-3.5" />
            En catálogo
          </p>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 p-3 border-b border-slate-100 bg-slate-50/80 text-[10px] text-slate-500 uppercase tracking-wide">
              <span className="w-12">Img</span>
              <span className="flex-1">Producto</span>
              <span className="w-20 text-right">Precio</span>
            </div>
            <div className="flex items-center gap-3 p-3">
              <ProductImage src={previewProduct.imagen_url} alt={displayName} size="xs" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">{displayName}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {displayCode || <span className="text-slate-400 italic font-sans">Sin código</span>}
                </p>
                <ProductMetaChips color={color} talle={talle} className="mt-1" />
                {categoryName && (
                  <p className="text-[10px] text-slate-400 mt-1 truncate">{categoryName}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-slate-800 text-sm tabular-nums">
                  {formatCurrency(price)}
                </p>
                <Badge variant={estado} className="mt-1 text-[10px] px-1.5 py-0">
                  {estado || 'activo'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        La vista se actualiza automáticamente mientras completa los campos.
      </p>
    </div>
  );
};

import { formatQuantityDisplay } from '../../utils/productPricing';

/**
 * Muestra cantidad y tipo con espaciado claro.
 * Paquete: "1 paquete" + "(20 uds)"
 * Suelto: "5" + "uds · Suelto"
 */
export const QuantityLineDisplay = ({ line, align = 'right', className = '' }) => {
  const qty = formatQuantityDisplay(line);
  const alignClass = align === 'right' ? 'text-right' : 'text-left';

  return (
    <div className={`${alignClass} ${className}`}>
      <p className="font-medium text-slate-800 tabular-nums leading-snug">{qty.primary}</p>
      <p className="text-xs text-slate-500 mt-0.5 leading-snug">
        {qty.modo === 'paquete' ? (
          <>
            <span className="text-slate-600">{qty.modoLabel}</span>
            <span className="mx-1 text-slate-300">·</span>
            <span>{qty.secondary}</span>
          </>
        ) : (
          <>
            <span>{qty.secondary}</span>
            <span className="mx-1 text-slate-300">·</span>
            <span>{qty.modoLabel}</span>
          </>
        )}
      </p>
    </div>
  );
};

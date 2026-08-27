import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatQuantityDisplay } from '../../utils/productPricing';
import { BRAND_NAME } from '../../config/brand';

export const QuotePrint = ({ data, preview = false }) => {
  if (!data) return null;
  const { presupuesto, cliente, vendedor, detalle } = data;

  return (
    <div
      id="quote-print"
      className={`${preview ? 'block' : 'hidden print:block'} print:p-6 text-black bg-white max-w-md mx-auto`}
    >
      <div className="text-center border-b border-dashed border-slate-400 pb-4 mb-4">
        <h1 className="text-xl font-bold tracking-tight">{BRAND_NAME}</h1>
        <p className="text-xs text-slate-600 mt-1">PRESUPUESTO</p>
        <p className="text-sm font-mono font-semibold mt-2">{presupuesto.numero}</p>
        <p className="text-xs text-slate-500">{formatDate(presupuesto.fecha_presupuesto)}</p>
        {presupuesto.validez_hasta && (
          <p className="text-xs text-amber-700 mt-1">
            Válido hasta {formatDate(presupuesto.validez_hasta)}
          </p>
        )}
      </div>

      <div className="text-xs space-y-1 mb-4">
        <p>
          <span className="text-slate-500">Cliente:</span>{' '}
          {cliente?.nombre || 'Consumidor final'}
        </p>
        {cliente?.numero_documento && (
          <p>
            <span className="text-slate-500">Doc.:</span> {cliente.tipo_documento}{' '}
            {cliente.numero_documento}
          </p>
        )}
        <p>
          <span className="text-slate-500">Vendedor:</span> {vendedor}
        </p>
      </div>

      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b border-slate-300">
            <th className="text-left py-1">Producto</th>
            <th className="text-right py-1">Cantidad</th>
            <th className="text-right py-1">P. unit.</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {detalle?.map((line, i) => {
            const qty = formatQuantityDisplay(line);
            return (
              <tr key={line.id ?? i} className="border-b border-slate-100">
                <td className="py-1.5 pr-2">
                  <div>{line.producto_nombre}</div>
                  <div className="text-slate-400">{line.producto_codigo}</div>
                  {Number(line.descuento) > 0 && (
                    <div className="text-slate-500">
                      Desc. −{formatCurrency(line.descuento)}
                    </div>
                  )}
                </td>
                <td className="text-right py-1.5 pl-2">
                  <div className="tabular-nums">{qty.primary}</div>
                  <div className="text-slate-500 text-[10px]">{qty.secondary}</div>
                </td>
                <td className="text-right py-1.5 whitespace-nowrap">
                  {formatCurrency(line.precio_unitario)}
                </td>
                <td className="text-right py-1.5 whitespace-nowrap">
                  {formatCurrency(line.subtotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="text-sm space-y-1 border-t border-dashed border-slate-400 pt-3">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(presupuesto.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Descuento</span>
          <span>-{formatCurrency(presupuesto.descuento)}</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-1">
          <span>TOTAL</span>
          <span>{formatCurrency(presupuesto.total)}</span>
        </div>
      </div>

      {presupuesto.observaciones && (
        <div className="mt-4 text-xs border-t border-dashed border-slate-300 pt-3">
          <p className="text-slate-500 font-semibold mb-1">Observaciones</p>
          <p className="whitespace-pre-wrap">{presupuesto.observaciones}</p>
        </div>
      )}

      {presupuesto.estado === 'anulado' && (
        <p className="text-center text-red-600 font-bold text-sm mt-6">PRESUPUESTO ANULADO</p>
      )}

      <p className="text-[10px] text-slate-400 text-center mt-6">
        Documento no válido como comprobante fiscal — {BRAND_NAME}
      </p>
    </div>
  );
};

export const printQuote = () => {
  window.print();
};

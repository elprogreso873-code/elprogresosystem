import { formatDate } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';
import { METODO_PAGO_LABELS } from '../../constants/permissions';
import { formatQuantityDisplay } from '../../utils/productPricing';
import { BRAND_NAME } from '../../config/brand';

const tipoLabel = { ticket: 'TICKET', factura: 'FACTURA', boleta: 'BOLETA' };

export const SaleReceiptPrint = ({ data, preview = false }) => {
  if (!data) return null;
  const { comprobante, venta, detalle } = data;

  return (
    <div
      id="sale-receipt-print"
      className={`${preview ? 'block' : 'hidden print:block'} print:p-6 text-black bg-white max-w-md mx-auto`}
    >
      <div className="text-center border-b border-dashed border-slate-400 pb-4 mb-4">
        <h1 className="text-xl font-bold tracking-tight">{BRAND_NAME}</h1>
        <p className="text-xs text-slate-600 mt-1">{tipoLabel[comprobante.tipo] || 'COMPROBANTE'}</p>
        <p className="text-sm font-mono font-semibold mt-2">{comprobante.numero}</p>
        <p className="text-xs text-slate-500">{formatDate(comprobante.fecha_emision)}</p>
      </div>

      <div className="text-xs space-y-1 mb-4">
        <p><span className="text-slate-500">Venta:</span> {venta.numero}</p>
        <p><span className="text-slate-500">Cliente:</span> {venta.cliente_nombre || 'Consumidor final'}</p>
        {venta.numero_documento && (
          <p><span className="text-slate-500">Doc.:</span> {venta.tipo_documento} {venta.numero_documento}</p>
        )}
        <p><span className="text-slate-500">Vendedor:</span> {venta.vendedor}</p>
        <p>
          <span className="text-slate-500">Pago:</span>{' '}
          {venta.metodo_pago_nombre || METODO_PAGO_LABELS[venta.metodo_pago] || venta.metodo_pago}
        </p>
        {venta.pagos?.length > 1 && (
          <div className="mt-1 space-y-0.5">
            {venta.pagos.map((pago, index) => (
              <p key={pago.id ?? index}>
                · {pago.metodo_pago_nombre}: {formatCurrency(pago.monto)}
              </p>
            ))}
          </div>
        )}
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
              <tr key={i} className="border-b border-slate-100">
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
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(venta.subtotal)}</span></div>
        <div className="flex justify-between"><span>Descuento</span><span>-{formatCurrency(venta.descuento)}</span></div>
        <div className="flex justify-between font-bold text-base pt-1">
          <span>TOTAL</span><span>{formatCurrency(venta.total)}</span>
        </div>
        {venta.monto_recibido != null && (
          <>
            <div className="flex justify-between text-xs pt-2">
              <span>Recibido</span><span>{formatCurrency(venta.monto_recibido)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Vuelto</span><span>{formatCurrency(venta.vuelto ?? 0)}</span>
            </div>
          </>
        )}
      </div>

      {venta.estado === 'anulada' && (
        <p className="text-center text-red-600 font-bold text-sm mt-6 border-2 border-red-600 py-2">
          ANULADA
        </p>
      )}

      <p className="text-center text-[10px] text-slate-400 mt-8">Gracias por su compra</p>
    </div>
  );
};

export const printSaleReceipt = () => {
  window.print();
};

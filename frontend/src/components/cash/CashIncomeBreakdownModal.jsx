import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../utils/formatCurrency';

export const CashIncomeBreakdownModal = ({ isOpen, onClose, resumen }) => {
  if (!resumen) return null;

  const ventas = resumen.ventas_por_metodo || [];
  const cobros = resumen.cobros_cc_por_metodo || [];
  const egresos = resumen.egresos_por_metodo || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de ingresos" size="lg">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-sm text-slate-600">Total ingresos del turno</p>
          <p className="text-2xl font-bold text-emerald-800">{formatCurrency(resumen.total_ingresos)}</p>
          <p className="text-xs text-slate-500 mt-1">Ventas + cobros a clientes + ingresos manuales</p>
        </div>

        <section>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Ventas por método de pago</h3>
          {ventas.length === 0 ? (
            <p className="text-sm text-slate-500">Sin ventas en este turno</p>
          ) : (
            <ul className="space-y-2">
              {ventas.map((item) => (
                <li
                  key={item.metodo_pago}
                  className="flex justify-between items-center py-2 px-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <span className="text-sm text-slate-700">
                    {item.nombre}
                    {item.es_cuenta_corriente && (
                      <span className="block text-xs text-slate-400">No suma al efectivo en caja</span>
                    )}
                  </span>
                  <span className="font-semibold text-sm">{formatCurrency(item.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {cobros.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Cobros de cuenta corriente</h3>
            <ul className="space-y-2">
              {cobros.map((item) => (
                <li
                  key={item.metodo_pago}
                  className="flex justify-between items-center py-2 px-3 rounded-lg bg-blue-50 border border-blue-100"
                >
                  <span className="text-sm text-slate-700">{item.nombre}</span>
                  <span className="font-semibold text-sm text-blue-800">
                    {formatCurrency(item.total)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {egresos.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Egresos</h3>
            <ul className="space-y-2">
              {egresos.map((item) => (
                <li
                  key={item.metodo_pago}
                  className="flex justify-between items-center py-2 px-3 rounded-lg bg-red-50 border border-red-100"
                >
                  <span className="text-sm text-slate-700">{item.nombre}</span>
                  <span className="font-semibold text-sm text-red-700">
                    −{formatCurrency(item.total)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
          <p className="text-sm font-medium text-slate-700">Ventas en cuenta corriente (solo vista)</p>
          <p className="text-xl font-bold text-slate-800 mt-1">
            {formatCurrency(resumen.total_ventas_cuenta_corriente)}
          </p>
        </div>
      </div>
    </Modal>
  );
};

import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../utils/formatCurrency';

const MethodList = ({ items, negative = false, accentClass = '' }) => (
  <ul className="mt-2 space-y-1.5">
    {items.map((item) => (
      <li
        key={item.metodo_pago}
        className="flex justify-between items-center py-2 px-3 rounded-lg bg-white border border-slate-100"
      >
        <span className="text-sm text-slate-600">{item.nombre}</span>
        <span className={`font-semibold text-sm tabular-nums ${accentClass}`}>
          {negative ? '−' : ''}
          {formatCurrency(item.total)}
        </span>
      </li>
    ))}
  </ul>
);

const Section = ({ title, total, items, negative = false, accentClass, badgeClass }) => {
  if (!items || items.length === 0) return null;
  return (
    <section className={`rounded-xl border p-4 ${badgeClass}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <span className={`text-sm font-bold tabular-nums ${accentClass}`}>
          {negative ? '−' : '+'}
          {formatCurrency(total)}
        </span>
      </div>
      <MethodList items={items} negative={negative} accentClass={accentClass} />
    </section>
  );
};

export const CashEfectivoBreakdownModal = ({ isOpen, onClose, resumen }) => {
  if (!resumen) return null;

  const desglose = resumen.efectivo_desglose || {};
  const apertura = resumen.monto_apertura ?? 0;
  const efectivo = resumen.efectivo_fisico_esperado ?? 0;

  const hayMovimientos =
    (desglose.ventas_por_metodo?.length ?? 0) > 0 ||
    (desglose.cobros_por_metodo?.length ?? 0) > 0 ||
    (desglose.ingresos_manuales_por_metodo?.length ?? 0) > 0 ||
    (desglose.egresos_por_metodo?.length ?? 0) > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle de efectivo en caja" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="p-4 rounded-xl bg-brand-50 border border-brand-200">
          <p className="text-sm text-slate-600">Efectivo en caja</p>
          <p className="text-2xl font-bold text-brand-800 tabular-nums">
            {formatCurrency(efectivo)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Apertura + ventas, cobros e ingresos en efectivo − egresos en efectivo
          </p>
        </div>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-800">Apertura de caja</h3>
            <span className="text-sm font-bold text-slate-700 tabular-nums">
              +{formatCurrency(apertura)}
            </span>
          </div>
        </section>

        <Section
          title="Ventas en efectivo"
          total={desglose.total_ventas ?? 0}
          items={desglose.ventas_por_metodo}
          accentClass="text-brand-700"
          badgeClass="border-brand-100 bg-brand-50/50"
        />

        <Section
          title="Cobros de cuenta corriente en efectivo"
          total={desglose.total_cobros ?? 0}
          items={desglose.cobros_por_metodo}
          accentClass="text-blue-700"
          badgeClass="border-blue-100 bg-blue-50/50"
        />

        <Section
          title="Ingresos manuales en efectivo"
          total={desglose.total_ingresos_manuales ?? 0}
          items={desglose.ingresos_manuales_por_metodo}
          accentClass="text-emerald-700"
          badgeClass="border-emerald-100 bg-emerald-50/50"
        />

        <Section
          title="Egresos en efectivo"
          total={desglose.total_egresos ?? 0}
          items={desglose.egresos_por_metodo}
          negative
          accentClass="text-red-700"
          badgeClass="border-red-100 bg-red-50/50"
        />

        {!hayMovimientos && (
          <p className="text-sm text-slate-500 text-center py-2">
            Sin movimientos en efectivo todavía. Solo la apertura.
          </p>
        )}

        <div className="p-4 rounded-xl border-2 border-brand-200 bg-brand-50 flex justify-between items-center">
          <p className="text-sm font-semibold text-slate-700">Total efectivo en caja</p>
          <p className="text-xl font-bold text-brand-800 tabular-nums">
            {formatCurrency(efectivo)}
          </p>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Los pagos con tarjeta, transferencia o cuenta corriente no suman al efectivo del cajón.
        </p>
      </div>
    </Modal>
  );
};

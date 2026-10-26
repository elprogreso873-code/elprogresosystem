import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Select } from '../ui/Select';
import { formatCurrency } from '../../utils/formatCurrency';
import { Link } from 'react-router-dom';
import { Wallet } from 'lucide-react';

export const PurchaseCheckoutModal = ({
  isOpen,
  onClose,
  proveedorNombre,
  computedTotal,
  total,
  itemCount,
  pagada,
  onPagadaChange,
  montoPagado,
  onMontoPagadoChange,
  metodoPago,
  onMetodoPagoChange,
  pagaConCaja,
  onPagaConCajaChange,
  paymentMethods,
  cashSession,
  cashLoading,
  observaciones,
  onObservacionesChange,
  onSubmit,
  submitting,
  error,
}) => {
  const methods = (paymentMethods || []).filter((m) => !m.genera_cargo_cc);
  const methodOptions = methods.length
    ? methods.map((m) => ({ value: m.codigo, label: m.nombre }))
    : [{ value: 'efectivo', label: 'Efectivo' }];
  const needsCash = pagada && pagaConCaja && Number(montoPagado) > 0;
  const missingCash = needsCash && !cashLoading && !cashSession;
  const saldo = Math.max(0, Number(total) - Number(montoPagado || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar compra"
      size="md"
      stickyFooter
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Volver
          </Button>
          <Button
            onClick={onSubmit}
            isLoading={submitting}
            disabled={submitting || missingCash || !proveedorNombre}
          >
            Registrar compra
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Proveedor</p>
          <p className="font-semibold text-slate-800">{proveedorNombre || '—'}</p>
          <p className="text-sm text-slate-500 mt-1">
            {itemCount} producto{itemCount !== 1 ? 's' : ''} · calculado {formatCurrency(computedTotal)}
          </p>
          <p className="text-xl font-bold text-brand-700 tabular-nums mt-1">
            {formatCurrency(total)}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">¿Esta compra ya está paga?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onPagadaChange(true)}
              className={`rounded-xl border px-3 py-3 text-sm font-medium ${
                pagada
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              Sí, la pagué
            </button>
            <button
              type="button"
              onClick={() => onPagadaChange(false)}
              className={`rounded-xl border px-3 py-3 text-sm font-medium ${
                !pagada
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              No, queda a deber
            </button>
          </div>
        </div>

        {pagada ? (
          <>
            <CurrencyInput
              id="compra-monto-pagado"
              label="Monto pagado"
              size="md"
              hint="Puede ser menor al total si paga una parte"
              value={montoPagado}
              onChange={(v) => onMontoPagadoChange(v ?? 0)}
              max={total}
            />
            <Select
              id="compra-metodo"
              label="Método de pago"
              value={metodoPago}
              onChange={(e) => onMetodoPagoChange(e.target.value)}
              options={methodOptions}
            />
            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
              <input
                type="checkbox"
                className="mt-1 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={pagaConCaja}
                onChange={(e) => onPagaConCajaChange(e.target.checked)}
              />
              <span>
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <Wallet className="w-4 h-4" />
                  Descontar de la caja actual
                </span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Márcalo si pagaste con efectivo del turno abierto. Si fue transferencia u otro
                  medio fuera de caja, dejalo destildado.
                </span>
              </span>
            </label>
            {missingCash && (
              <Alert variant="info">
                No hay caja abierta.{' '}
                <Link to="/caja" className="underline font-medium">
                  Abrir caja
                </Link>{' '}
                o destildá el descuento de caja.
              </Alert>
            )}
            {saldo > 0.009 && (
              <p className="text-sm text-amber-800">
                Quedará un saldo de {formatCurrency(saldo)} a este proveedor.
              </p>
            )}
          </>
        ) : (
          <Alert variant="info">
            El total {formatCurrency(total)} quedará como saldo de {proveedorNombre || 'el proveedor'}.
            Después podés registrar pagos desde Proveedores.
          </Alert>
        )}

        <label className="block">
          <span className="block text-sm font-medium text-slate-700 mb-1.5">Observaciones</span>
          <textarea
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm min-h-[80px]"
            value={observaciones}
            onChange={(e) => onObservacionesChange(e.target.value)}
            placeholder="Opcional"
          />
        </label>
      </div>
    </Modal>
  );
};

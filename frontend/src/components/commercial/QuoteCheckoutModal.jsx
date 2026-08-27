import { User, FileText, CalendarDays } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { CurrencyInput } from '../ui/CurrencyInput';
import { ClientSearchSelect } from './ClientSearchSelect';
import { formatCurrency } from '../../utils/formatCurrency';

const VALIDEZ_OPTIONS = [
  { value: '7', label: '7 días' },
  { value: '15', label: '15 días' },
  { value: '30', label: '30 días' },
  { value: '60', label: '60 días' },
  { value: '90', label: '90 días' },
];

export const QuoteCheckoutModal = ({
  isOpen,
  onClose,
  clients,
  clienteId,
  onClienteChange,
  onClientSelect,
  observaciones,
  onObservacionesChange,
  descuentoGlobal,
  onDescuentoChange,
  validezDias,
  onValidezDiasChange,
  total,
  subtotal,
  onSubmit,
  submitting,
  submitDisabled,
}) => {
  const footer = (
    <>
      <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={onClose}>
        Seguir agregando
      </Button>
      <Button
        type="button"
        className="w-full sm:w-auto min-h-12 shadow-md"
        size="lg"
        onClick={onSubmit}
        isLoading={submitting}
        disabled={submitDisabled}
      >
        Confirmar presupuesto · {formatCurrency(total)}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar presupuesto"
      size="lg"
      footer={footer}
      stickyFooter
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section className="space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <User className="w-4 h-4" /> Cliente
            </h4>
            <ClientSearchSelect
              clients={clients}
              value={clienteId}
              onChange={onClienteChange}
              onSelect={onClientSelect}
            />
          </section>

          <section className="space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <CalendarDays className="w-4 h-4" /> Validez
            </h4>
            <Select
              id="validez-presupuesto"
              label="Válido por"
              hidePlaceholder
              value={String(validezDias)}
              onChange={(e) => onValidezDiasChange(Number(e.target.value))}
              options={VALIDEZ_OPTIONS}
            />
          </section>
        </div>

        <section className="space-y-3">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <FileText className="w-4 h-4" /> Observaciones
          </h4>
          <textarea
            id="obs-presupuesto"
            rows={3}
            maxLength={500}
            value={observaciones}
            onChange={(e) => onObservacionesChange(e.target.value)}
            placeholder="Condiciones, plazos de entrega, notas para el cliente…"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          <CurrencyInput
            id="descuento-presupuesto"
            label="Descuento global"
            value={descuentoGlobal}
            onChange={onDescuentoChange}
            max={subtotal}
          />
          <div className="flex justify-between items-center pt-2 border-t border-slate-200">
            <span className="font-semibold text-slate-800">Total</span>
            <span className="text-xl font-bold text-brand-700 tabular-nums">
              {formatCurrency(total)}
            </span>
          </div>
        </section>

        <p className="text-xs text-slate-500">
          El presupuesto no afecta stock ni caja. Podrá enviarlo por WhatsApp o descargar el PDF
          desde el detalle.
        </p>
      </div>
    </Modal>
  );
};

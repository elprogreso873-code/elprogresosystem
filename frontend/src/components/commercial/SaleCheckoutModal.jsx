import { useState } from 'react';
import { User, FileText, Receipt, Wallet, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { CurrencyInput } from '../ui/CurrencyInput';
import { ClientSearchSelect } from './ClientSearchSelect';
import { DualPaymentEditor } from './DualPaymentEditor';
import { Alert } from '../ui/Alert';
import { formatCurrency } from '../../utils/formatCurrency';

export const SaleCheckoutModal = ({
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
  paymentMethods,
  splitMode,
  onSplitModeChange,
  paymentLines,
  onPaymentLinesChange,
  defaultMethodCode,
  tipoComprobante,
  onTipoComprobanteChange,
  tipoComprobanteOptions,
  selectedClient,
  hasCuentaCorriente,
  total,
  subtotal,
  paymentSummaryLabel,
  needsCashWarning,
  cashSession,
  onSubmit,
  submitting,
  submitDisabled,
}) => {
  const [showExtras, setShowExtras] = useState(false);

  const footer = (
    <>
      <div className="w-full sm:flex-1 sm:min-w-0">
        <p className="text-[11px] text-slate-500 truncate mb-1 sm:mb-0.5">
          {paymentSummaryLabel}
          {!showExtras && Number(descuentoGlobal) > 0
            ? ` · Desc. −${formatCurrency(descuentoGlobal)}`
            : ''}
        </p>
        <p className="text-lg font-bold text-slate-900 tabular-nums sm:hidden">
          Total {formatCurrency(total)}
        </p>
      </div>
      <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={onClose}>
        Seguir
      </Button>
      <Button
        type="button"
        className="w-full sm:w-auto min-h-12 shadow-md"
        size="lg"
        onClick={onSubmit}
        isLoading={submitting}
        disabled={submitDisabled}
      >
        Confirmar · {formatCurrency(total)}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar pago"
      size="lg"
      footer={footer}
      stickyFooter
    >
      <div className="space-y-3">
        {needsCashWarning && (
          <Alert variant="info" className="!py-2 text-sm">
            Debe tener la caja abierta para pagos en caja.
            {!cashSession && ' Abra un turno en Caja antes de confirmar.'}
          </Alert>
        )}

        {/* Pago primero: lo más usado, sin scroll innecesario */}
        <DualPaymentEditor
          paymentMethods={paymentMethods}
          total={total}
          splitMode={splitMode}
          onSplitModeChange={onSplitModeChange}
          lines={paymentLines}
          onLinesChange={onPaymentLinesChange}
          defaultMethodCode={defaultMethodCode}
          autoFillRemainder
        />

        <div className="rounded-xl bg-slate-900 text-white px-3.5 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-slate-400">Total a cobrar</p>
            <p className="text-xl font-bold text-brand-400 tabular-nums">{formatCurrency(total)}</p>
          </div>
          <div className="text-right text-[11px] text-slate-400 shrink-0">
            <p>Subtotal {formatCurrency(subtotal)}</p>
            {Number(descuentoGlobal) > 0 && (
              <p className="text-red-300">Desc. −{formatCurrency(descuentoGlobal)}</p>
            )}
          </div>
        </div>

        {hasCuentaCorriente && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-3 text-sm">
            <p className="font-medium text-sky-900 flex items-center gap-1.5">
              <Wallet className="w-4 h-4" />
              {selectedClient
                ? `Cargo CC · ${selectedClient.nombre}`
                : 'Seleccione cliente para cuenta corriente'}
            </p>
            {selectedClient && (
              <p className="text-xs text-sky-800 mt-1">
                Saldo: {formatCurrency(selectedClient.saldo_cuenta_corriente ?? 0)}
                {selectedClient.limite_credito != null && (
                  <> · Límite {formatCurrency(selectedClient.limite_credito)}</>
                )}
              </p>
            )}
          </div>
        )}

        <section className="space-y-2">
          <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <User className="w-3.5 h-3.5 text-brand-600" />
            Cliente
          </h4>
          <ClientSearchSelect
            id="modal-cliente"
            label={null}
            size="md"
            value={clienteId}
            clients={clients}
            onChange={onClienteChange}
            onClientSelect={onClientSelect}
          />
          <Select
            id="modal-tipo-comp"
            label="Comprobante"
            size="md"
            hidePlaceholder
            value={tipoComprobante}
            onChange={(e) => onTipoComprobanteChange(e.target.value)}
            options={tipoComprobanteOptions}
          />
        </section>

        <button
          type="button"
          onClick={() => setShowExtras((v) => !v)}
          className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <span className="inline-flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-slate-400" />
            Descuento y observaciones
          </span>
          {showExtras ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showExtras && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-slate-100 p-3">
            <CurrencyInput
              label="Descuento global"
              size="md"
              value={descuentoGlobal}
              onChange={(v) => onDescuentoChange(v ?? 0)}
            />
            <div>
              <label
                htmlFor="modal-obs"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Observaciones
              </label>
              <textarea
                id="modal-obs"
                value={observaciones}
                onChange={(e) => onObservacionesChange(e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 resize-none"
                placeholder="Opcional"
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

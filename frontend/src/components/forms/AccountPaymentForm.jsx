import { useEffect, useState } from 'react';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { DualPaymentEditor, createPaymentLine } from '../commercial/DualPaymentEditor';
import { formatCurrency } from '../../utils/formatCurrency';

export const AccountPaymentForm = ({
  formId = 'account-payment-form',
  saldoPendiente,
  paymentMethods = [],
  defaultMetodo = 'efectivo',
  onSubmit,
}) => {
  const methods =
    paymentMethods.length > 0
      ? paymentMethods
      : [
          {
            codigo: 'efectivo',
            nombre: 'Efectivo',
            requiere_monto_recibido: true,
            genera_cargo_cc: false,
            registra_en_caja: true,
          },
        ];

  const defaultCode = methods.some((m) => m.codigo === defaultMetodo)
    ? defaultMetodo
    : methods[0]?.codigo || 'efectivo';

  const [monto, setMonto] = useState(saldoPendiente > 0 ? saldoPendiente : 0);
  const [splitMode, setSplitMode] = useState(false);
  const [lines, setLines] = useState(() => {
    const method = methods.find((m) => m.codigo === defaultCode);
    const initial = saldoPendiente > 0 ? saldoPendiente : 0;
    return [
      createPaymentLine(
        defaultCode,
        initial,
        method?.requiere_monto_recibido ? initial : null
      ),
    ];
  });
  const [observaciones, setObservaciones] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (splitMode) return;
    const code = lines[0]?.metodo_pago || defaultCode;
    const method = methods.find((m) => m.codigo === code);
    const nextRecibido = method?.requiere_monto_recibido ? monto : null;
    setLines((prev) => {
      const current = prev[0];
      if (
        current &&
        current.metodo_pago === code &&
        Number(current.monto) === Number(monto) &&
        Number(current.monto_recibido ?? 0) === Number(nextRecibido ?? 0)
      ) {
        return prev;
      }
      return [createPaymentLine(code, monto, nextRecibido)];
    });
    // Solo re-sincronizar cuando cambia el monto total en modo 1 método
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monto, splitMode]);

  const allocated = lines.reduce((acc, l) => acc + (Number(l.monto) || 0), 0);
  const balanced = Math.abs(allocated - Number(monto)) < 0.01;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const total = Number(monto);
    if (!Number.isFinite(total) || total <= 0) {
      setError('Ingrese un monto mayor a 0');
      return;
    }
    if (total > saldoPendiente + 0.009) {
      setError(`No puede superar ${formatCurrency(saldoPendiente)}`);
      return;
    }
    if (!balanced) {
      setError('La suma de los métodos debe coincidir con el monto a cobrar');
      return;
    }
    if (lines.some((l) => !l.metodo_pago || Number(l.monto) <= 0)) {
      setError('Complete método y monto en cada parte');
      return;
    }

    const payload = {
      monto: total,
      observaciones: observaciones.trim() || null,
      pagos: lines.map((l) => ({
        metodo_cobro: l.metodo_pago,
        monto: Number(l.monto),
      })),
    };

    if (lines.length === 1) {
      payload.metodo_cobro = lines[0].metodo_pago;
    }

    onSubmit(payload);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 text-sm text-slate-700 flex flex-wrap items-center justify-between gap-2">
        <span>
          Saldo pendiente:{' '}
          <span className="font-bold text-amber-800 tabular-nums">
            {formatCurrency(saldoPendiente)}
          </span>
        </span>
        <button
          type="button"
          className="text-xs font-semibold text-brand-700 hover:underline"
          onClick={() => setMonto(saldoPendiente)}
        >
          Cobrar todo
        </button>
      </div>

      <CurrencyInput
        id="pay-monto"
        label="Monto a cobrar"
        size="md"
        min={0.01}
        max={saldoPendiente}
        value={monto}
        onChange={(v) => setMonto(v ?? 0)}
      />

      <DualPaymentEditor
        title="Cómo paga"
        paymentMethods={methods}
        total={Number(monto) || 0}
        splitMode={splitMode}
        onSplitModeChange={setSplitMode}
        lines={lines}
        onLinesChange={setLines}
        defaultMethodCode={defaultCode}
        hideCuentaCorrienteHints
        autoFillRemainder={false}
      />

      <p className="text-xs text-slate-500 -mt-1">
        Con 2 métodos, en caja aparecen dos movimientos de la misma cobranza.
      </p>

      <Input
        id="pay-obs"
        label="Observaciones"
        size="md"
        placeholder="Opcional"
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
};

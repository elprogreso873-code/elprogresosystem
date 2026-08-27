import { useMemo } from 'react';
import { Split } from 'lucide-react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { formatCurrency } from '../../utils/formatCurrency';

const newLineId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

export const createPaymentLine = (metodoPago, monto = 0, montoRecibido = null) => ({
  id: newLineId(),
  metodo_pago: metodoPago,
  monto: Number(monto) || 0,
  // Se mantiene por compatibilidad con el backend; la UI ya no pide "recibido/vuelto"
  monto_recibido: montoRecibido != null ? Number(montoRecibido) : null,
});

const withSilentRecibido = (method, monto) =>
  method?.requiere_monto_recibido ? Number(monto) || 0 : null;

const chipClass = (active) =>
  `px-2 py-1.5 rounded-lg text-xs font-medium transition-all border touch-manipulation truncate max-w-full ${
    active
      ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
      : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
  }`;

/**
 * Editor compacto de 1 o 2 métodos de pago (lado a lado).
 * @param {boolean} autoFillRemainder — solo ventas: al editar un monto, completa el otro
 */
export const DualPaymentEditor = ({
  paymentMethods = [],
  total = 0,
  splitMode,
  onSplitModeChange,
  lines,
  onLinesChange,
  defaultMethodCode,
  hideCuentaCorrienteHints = false,
  autoFillRemainder = false,
  title = 'Forma de pago',
}) => {
  const methodsByCode = useMemo(
    () => Object.fromEntries(paymentMethods.map((m) => [m.codigo, m])),
    [paymentMethods]
  );

  const allocated = useMemo(
    () => lines.reduce((acc, line) => acc + (Number(line.monto) || 0), 0),
    [lines]
  );
  const remainder = roundMoney(total - allocated);
  const isBalanced = Math.abs(remainder) < 0.01;

  const handleSingleMethod = (code) => {
    const method = methodsByCode[code];
    onLinesChange([createPaymentLine(code, total, withSilentRecibido(method, total))]);
  };

  const enableSplit = () => {
    onSplitModeChange(true);
    const firstCode =
      lines[0]?.metodo_pago || defaultMethodCode || paymentMethods[0]?.codigo || 'efectivo';
    const secondCode =
      paymentMethods.find((m) => m.codigo !== firstCode)?.codigo || firstCode;
    const m1 = methodsByCode[firstCode];
    const m2 = methodsByCode[secondCode];

    if (autoFillRemainder) {
      // Izquierda vacía para tipear; derecha queda con el total hasta que se edite
      onLinesChange([
        createPaymentLine(firstCode, 0, withSilentRecibido(m1, 0)),
        createPaymentLine(secondCode, total, withSilentRecibido(m2, total)),
      ]);
      return;
    }

    const half = roundMoney(total / 2);
    const rest = roundMoney(total - half);
    onLinesChange([
      createPaymentLine(firstCode, half, withSilentRecibido(m1, half)),
      createPaymentLine(secondCode, rest, withSilentRecibido(m2, rest)),
    ]);
  };

  const disableSplit = () => {
    onSplitModeChange(false);
    const current = lines[0]?.metodo_pago || defaultMethodCode || 'efectivo';
    handleSingleMethod(current);
  };

  const setLineMethod = (line, code) => {
    const other = lines.find((l) => l.id !== line.id);
    if (other && other.metodo_pago === code) {
      onLinesChange(
        lines.map((l) => {
          if (l.id === line.id) {
            const m = methodsByCode[code];
            return {
              ...l,
              metodo_pago: code,
              monto_recibido: withSilentRecibido(m, l.monto),
            };
          }
          if (l.id === other.id) {
            const m = methodsByCode[line.metodo_pago];
            return {
              ...l,
              metodo_pago: line.metodo_pago,
              monto_recibido: withSilentRecibido(m, l.monto),
            };
          }
          return l;
        })
      );
      return;
    }
    const m = methodsByCode[code];
    onLinesChange(
      lines.map((l) =>
        l.id === line.id
          ? {
              ...l,
              metodo_pago: code,
              monto_recibido: withSilentRecibido(m, l.monto),
            }
          : l
      )
    );
  };

  const setLineAmount = (lineId, rawAmount) => {
    const monto = Math.max(0, roundMoney(rawAmount ?? 0));
    const line = lines.find((l) => l.id === lineId);
    if (!line) return;
    const method = methodsByCode[line.metodo_pago];

    if (!autoFillRemainder || lines.length < 2) {
      onLinesChange(
        lines.map((l) =>
          l.id === lineId
            ? { ...l, monto, monto_recibido: withSilentRecibido(method, monto) }
            : l
        )
      );
      return;
    }

    const capped = Math.min(monto, roundMoney(total));
    const otherMonto = Math.max(0, roundMoney(total - capped));
    onLinesChange(
      lines.map((l) => {
        if (l.id === lineId) {
          return {
            ...l,
            monto: capped,
            monto_recibido: withSilentRecibido(method, capped),
          };
        }
        const otherMethod = methodsByCode[l.metodo_pago];
        return {
          ...l,
          monto: otherMonto,
          monto_recibido: withSilentRecibido(otherMethod, otherMonto),
        };
      })
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs">
          <button
            type="button"
            onClick={disableSplit}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              !splitMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            1 método
          </button>
          <button
            type="button"
            onClick={enableSplit}
            disabled={paymentMethods.length < 2}
            className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors inline-flex items-center gap-1 disabled:opacity-40 ${
              splitMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            <Split className="w-3 h-3" />
            2 métodos
          </button>
        </div>
      </div>

      {!splitMode ? (
        <>
          <div className="flex flex-wrap gap-1.5">
            {paymentMethods.map((method) => {
              const active = lines[0]?.metodo_pago === method.codigo;
              return (
                <button
                  key={method.codigo}
                  type="button"
                  onClick={() => handleSingleMethod(method.codigo)}
                  className={chipClass(active)}
                >
                  {method.nombre}
                  {!hideCuentaCorrienteHints && method.genera_cargo_cc ? ' · CC' : ''}
                </button>
              );
            })}
          </div>
          {!hideCuentaCorrienteHints && methodsByCode[lines[0]?.metodo_pago]?.genera_cargo_cc && (
            <p className="text-xs text-sky-700">Se cargará a la cuenta corriente del cliente.</p>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {lines.slice(0, 2).map((line, index) => {
              const method = methodsByCode[line.metodo_pago];
              return (
                <div
                  key={line.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 space-y-2 min-w-0"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Parte {index + 1}
                  </p>
                  <div className="flex flex-col gap-1">
                    {paymentMethods.map((m) => (
                      <button
                        key={m.codigo}
                        type="button"
                        onClick={() => setLineMethod(line, m.codigo)}
                        className={chipClass(line.metodo_pago === m.codigo)}
                      >
                        {m.nombre}
                      </button>
                    ))}
                  </div>
                  <CurrencyInput
                    label="Monto"
                    size="md"
                    value={line.monto}
                    onChange={(v) => setLineAmount(line.id, v)}
                  />
                  {!hideCuentaCorrienteHints && method?.genera_cargo_cc && (
                    <p className="text-[11px] text-sky-700">Cargo a CC</p>
                  )}
                </div>
              );
            })}
          </div>

          <div
            className={`text-sm font-medium tabular-nums text-center py-0.5 ${
              isBalanced ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {isBalanced
              ? `Total cubierto · ${formatCurrency(total)}`
              : `Falta ${formatCurrency(Math.abs(remainder))}`}
          </div>
        </div>
      )}
    </section>
  );
};

export const SalePaymentSplitEditor = DualPaymentEditor;

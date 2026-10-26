import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { DualPaymentEditor, createPaymentLine } from '../commercial/DualPaymentEditor';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDateOnly } from '../../utils/formatDate';
import { DATE_RANGE_PRESETS, isValidDateRange } from '../../utils/dateRange';
import { cuentaCorrienteService } from '../../services/cuentaCorrienteService';
import { getErrorMessage } from '../../utils/getErrorMessage';

const PERIOD_PRESETS = DATE_RANGE_PRESETS.filter((p) =>
  ['lastMonth', 'thisMonth', 'today'].includes(p.id)
);

const FALLBACK_METHODS = [
  {
    codigo: 'efectivo',
    nombre: 'Efectivo',
    requiere_monto_recibido: true,
    genera_cargo_cc: false,
    registra_en_caja: true,
  },
];

export const AccountPaymentForm = ({
  formId = 'account-payment-form',
  clienteId,
  saldoPendiente,
  paymentMethods = [],
  defaultMetodo = 'efectivo',
  onSubmit,
}) => {
  const methods = useMemo(
    () => (paymentMethods.length > 0 ? paymentMethods : FALLBACK_METHODS),
    [paymentMethods]
  );

  const defaultCode = methods.some((m) => m.codigo === defaultMetodo)
    ? defaultMetodo
    : methods[0]?.codigo || 'efectivo';

  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [period, setPeriod] = useState(null);
  const [periodError, setPeriodError] = useState(null);
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
  const splitModeRef = useRef(splitMode);
  const linesRef = useRef(lines);

  const rangeReady = isValidDateRange(fechaDesde, fechaHasta);
  const incompleteRange = Boolean(fechaDesde || fechaHasta) && !rangeReady;
  const periodMatches =
    rangeReady &&
    period &&
    period.fecha_desde === fechaDesde &&
    period.fecha_hasta === fechaHasta;
  const shownPeriod = periodMatches ? period : null;
  const shownPeriodError =
    rangeReady &&
    periodError &&
    periodError.desde === fechaDesde &&
    periodError.hasta === fechaHasta
      ? periodError.message
      : '';
  const maxCobro = shownPeriod ? shownPeriod.a_cobrar : saldoPendiente;
  const calculatingPeriod = rangeReady && !periodMatches && !shownPeriodError;

  const syncSingleLine = (nextMonto) => {
    const code = linesRef.current[0]?.metodo_pago || defaultCode;
    const method = methods.find((m) => m.codigo === code);
    const nextRecibido = method?.requiere_monto_recibido ? nextMonto : null;
    const nextLine = createPaymentLine(code, nextMonto, nextRecibido);
    linesRef.current = [nextLine];
    setLines([nextLine]);
  };

  const updateMonto = (nextMonto) => {
    setMonto(nextMonto);
    if (!splitModeRef.current) {
      syncSingleLine(nextMonto);
    }
  };

  useEffect(() => {
    splitModeRef.current = splitMode;
    linesRef.current = lines;
  }, [splitMode, lines]);

  useEffect(() => {
    if (!clienteId || !rangeReady) return undefined;

    let cancelled = false;
    const timer = setTimeout(() => {
      cuentaCorrienteService
        .getPeriodBalance(clienteId, {
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta,
        })
        .then((data) => {
          if (cancelled) return;
          setPeriod(data);
          setPeriodError(null);
          setMonto(data.a_cobrar);
          if (!splitModeRef.current) {
            const code = linesRef.current[0]?.metodo_pago || defaultCode;
            const method = methods.find((m) => m.codigo === code);
            const nextRecibido = method?.requiere_monto_recibido ? data.a_cobrar : null;
            setLines([createPaymentLine(code, data.a_cobrar, nextRecibido)]);
          }
        })
        .catch((err) => {
          if (cancelled) return;
          setPeriod(null);
          setPeriodError({
            desde: fechaDesde,
            hasta: fechaHasta,
            message: getErrorMessage(err),
          });
        });
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [clienteId, fechaDesde, fechaHasta, rangeReady, defaultCode, methods]);

  const allocated = lines.reduce((acc, l) => acc + (Number(l.monto) || 0), 0);
  const balanced = Math.abs(allocated - Number(monto)) < 0.01;

  const applyPreset = (presetId) => {
    const preset = PERIOD_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const range = preset.getRange();
    setFechaDesde(range.fecha_desde);
    setFechaHasta(range.fecha_hasta);
    setError('');
  };

  const clearPeriod = () => {
    setFechaDesde('');
    setFechaHasta('');
    updateMonto(saldoPendiente > 0 ? saldoPendiente : 0);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (incompleteRange) {
      setError('Complete ambas fechas del período o déjelas vacías');
      return;
    }
    if (rangeReady && calculatingPeriod) {
      setError('Espere a que se calcule el saldo del período');
      return;
    }
    if (shownPeriodError) {
      setError(shownPeriodError);
      return;
    }

    const total = Number(monto);
    if (!Number.isFinite(total) || total <= 0) {
      setError(
        shownPeriod && shownPeriod.a_cobrar <= 0
          ? 'Este período no tiene saldo pendiente'
          : 'Ingrese un monto mayor a 0'
      );
      return;
    }
    if (total > saldoPendiente + 0.009) {
      setError(`No puede superar ${formatCurrency(saldoPendiente)}`);
      return;
    }
    if (shownPeriod && total > shownPeriod.a_cobrar + 0.009) {
      setError(`El período no supera ${formatCurrency(shownPeriod.a_cobrar)}`);
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
    if (rangeReady) {
      payload.fecha_desde = fechaDesde;
      payload.fecha_hasta = fechaHasta;
    }

    onSubmit(payload);
  };

  return (
    <form id={formId} onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <CalendarRange className="w-4 h-4 text-brand-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Período a cobrar</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Si el cliente paga el mensual, indique las fechas. El monto se calcula solo con
                esos días.
              </p>
            </div>
          </div>
          {(fechaDesde || fechaHasta) && (
            <button
              type="button"
              className="text-xs font-semibold text-slate-600 hover:underline shrink-0"
              onClick={clearPeriod}
            >
              Limpiar
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PERIOD_PRESETS.map((preset) => {
            const range = preset.getRange();
            const active =
              fechaDesde === range.fecha_desde && fechaHasta === range.fecha_hasta;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-brand-700 text-white border-brand-700'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                }`}
              >
                {preset.shortLabel}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            id="pay-fecha-desde"
            type="date"
            label="Desde"
            size="md"
            value={fechaDesde}
            max={fechaHasta || undefined}
            onChange={(e) => {
              setFechaDesde(e.target.value);
              setError('');
            }}
          />
          <Input
            id="pay-fecha-hasta"
            type="date"
            label="Hasta"
            size="md"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={(e) => {
              setFechaHasta(e.target.value);
              setError('');
            }}
          />
        </div>

        {incompleteRange && (
          <p className="text-xs text-amber-700">Complete ambas fechas para calcular el período.</p>
        )}
        {calculatingPeriod && (
          <p className="text-xs text-slate-500">Calculando saldo del período…</p>
        )}
        {shownPeriodError && <p className="text-xs text-red-600">{shownPeriodError}</p>}
        {shownPeriod && (
          <div className="rounded-lg border border-brand-100 bg-white px-3 py-2.5 text-sm space-y-1.5">
            <p className="text-xs font-medium text-slate-500">
              {formatDateOnly(shownPeriod.fecha_desde)} — {formatDateOnly(shownPeriod.fecha_hasta)}
            </p>
            <div className="flex justify-between gap-3 text-slate-600">
              <span>
                Cargos ({shownPeriod.cargos_cantidad})
                {shownPeriod.anulaciones > 0 ? ' − anulaciones' : ''}
              </span>
              <span className="tabular-nums font-medium">
                {formatCurrency(shownPeriod.neto_periodo)}
              </span>
            </div>
            {shownPeriod.cobrado_periodo > 0 && (
              <div className="flex justify-between gap-3 text-slate-600">
                <span>Ya cobrado de este período</span>
                <span className="tabular-nums">
                  − {formatCurrency(shownPeriod.cobrado_periodo)}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-3 pt-1 border-t border-slate-100">
              <span className="font-semibold text-slate-800">A cobrar ahora</span>
              <span className="font-bold text-brand-800 tabular-nums">
                {formatCurrency(shownPeriod.a_cobrar)}
              </span>
            </div>
            {shownPeriod.saldo_periodo > shownPeriod.a_cobrar && (
              <p className="text-xs text-amber-700">
                El período da {formatCurrency(shownPeriod.saldo_periodo)}, pero el saldo actual es{' '}
                {formatCurrency(shownPeriod.saldo_total)}. Se cobra hasta el saldo actual.
              </p>
            )}
            {shownPeriod.a_cobrar <= 0 && (
              <p className="text-xs text-slate-500">
                Este período no tiene saldo pendiente. Elija otras fechas o cobre el saldo total.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 text-sm text-slate-700 flex flex-wrap items-center justify-between gap-2">
        <span>
          {shownPeriod ? 'Saldo de este período' : 'Saldo pendiente'}:{' '}
          <span className="font-bold text-amber-800 tabular-nums">
            {formatCurrency(maxCobro)}
          </span>
        </span>
        <button
          type="button"
          className="text-xs font-semibold text-brand-700 hover:underline"
          onClick={() => {
            if (shownPeriod) {
              updateMonto(shownPeriod.a_cobrar);
              return;
            }
            updateMonto(saldoPendiente);
          }}
        >
          {shownPeriod ? 'Usar este período' : 'Cobrar todo'}
        </button>
      </div>

      <CurrencyInput
        id="pay-monto"
        label="Monto a cobrar"
        size="md"
        min={0.01}
        max={maxCobro}
        value={monto}
        onChange={(v) => updateMonto(v ?? 0)}
      />

      <DualPaymentEditor
        title="Cómo paga"
        paymentMethods={methods}
        total={Number(monto) || 0}
        splitMode={splitMode}
        onSplitModeChange={(next) => {
          splitModeRef.current = next;
          setSplitMode(next);
          if (!next) {
            const code = linesRef.current[0]?.metodo_pago || defaultCode;
            const method = methods.find((m) => m.codigo === code);
            const nextRecibido = method?.requiere_monto_recibido ? monto : null;
            setLines([createPaymentLine(code, monto, nextRecibido)]);
          }
        }}
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

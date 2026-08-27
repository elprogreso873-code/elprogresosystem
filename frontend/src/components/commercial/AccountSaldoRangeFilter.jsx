import { useMemo, useState } from 'react';
import { Wallet, RotateCcw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { formatCurrency } from '../../utils/formatCurrency';

export const AccountSaldoRangeFilter = ({
  bounds,
  saldoDesde,
  saldoHasta,
  onDesdeChange,
  onHastaChange,
  onReset,
  disabled = false,
  error,
}) => {
  const [open, setOpen] = useState(false);

  const minBound = bounds?.saldo_min ?? 0;
  const maxBound = bounds?.saldo_max ?? 0;
  const hasRange = maxBound > minBound;

  const isFiltered = useMemo(
    () => saldoDesde > minBound || saldoHasta < maxBound,
    [saldoDesde, saldoHasta, minBound, maxBound]
  );

  const summaryLabel = useMemo(() => {
    if (!hasRange) {
      return maxBound === 0 ? 'Sin saldos' : `Único: ${formatCurrency(maxBound)}`;
    }
    if (isFiltered) {
      return `${formatCurrency(saldoDesde)} — ${formatCurrency(saldoHasta)}`;
    }
    return `Todos · ${formatCurrency(minBound)} — ${formatCurrency(maxBound)}`;
  }, [hasRange, maxBound, isFiltered, saldoDesde, saldoHasta, minBound]);

  const toggleOpen = () => {
    if (!hasRange || disabled) return;
    setOpen((v) => !v);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1.5 shrink-0 text-slate-500">
          <Wallet className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-semibold uppercase tracking-wide">Saldo</span>
        </div>

        <span
          className={`text-xs truncate flex-1 min-w-0 ${
            isFiltered ? 'font-medium text-brand-800' : 'text-slate-500'
          }`}
        >
          {summaryLabel}
        </span>

        {isFiltered && (
          <button
            type="button"
            onClick={onReset}
            disabled={disabled}
            className="text-xs text-slate-500 hover:text-brand-700 inline-flex items-center gap-0.5 shrink-0 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}

        {hasRange && (
          <button
            type="button"
            onClick={toggleOpen}
            disabled={disabled}
            className="text-xs text-slate-500 hover:text-brand-700 inline-flex items-center gap-0.5 shrink-0 disabled:opacity-50"
          >
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {open ? 'Ocultar' : 'Ajustar'}
          </button>
        )}
      </div>

      {open && hasRange && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 pt-2 border-t border-slate-100">
          <CurrencyInput
            id="saldo-desde"
            label="Desde"
            size="md"
            min={minBound}
            max={saldoHasta}
            value={saldoDesde}
            onChange={(v) => onDesdeChange(v ?? minBound)}
            disabled={disabled}
          />
          <CurrencyInput
            id="saldo-hasta"
            label="Hasta"
            size="md"
            min={saldoDesde}
            max={maxBound}
            value={saldoHasta}
            onChange={(v) => onHastaChange(v ?? maxBound)}
            disabled={disabled}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

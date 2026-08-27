import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarRange, Wallet, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import {
  DATE_RANGE_PRESETS,
  detectActivePreset,
  isValidDateRange,
  toLocalISODate,
} from '../../utils/dateRange';
import { formatDate, formatDateOnly } from '../../utils/formatDate';

const MOBILE_PRESET_IDS = ['today', 'last7', 'thisMonth', 'last30'];

const mobilePresetLabel = (label) => {
  const map = {
    Hoy: 'Hoy',
    '7 días': '7d',
    '30 días': '30d',
    'Este mes': 'Mes',
  };
  return map[label] ?? label;
};

const chipBase =
  'shrink-0 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all touch-manipulation border whitespace-nowrap';

const chipActive = 'bg-brand-500 text-white border-brand-500';
const chipIdle = 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50';

const dateInputClass =
  'h-9 sm:h-8 w-full min-w-0 flex-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500';

export const SalesPeriodFilter = ({
  fechaDesde,
  fechaHasta,
  onDesdeChange,
  onHastaChange,
  onPresetSelect,
  soloTurnoActual,
  onTurnoToggle,
  cashSession,
  loading = false,
}) => {
  const [showDates, setShowDates] = useState(false);

  const activePreset = useMemo(
    () => (soloTurnoActual ? 'turno' : detectActivePreset(fechaDesde, fechaHasta)),
    [fechaDesde, fechaHasta, soloTurnoActual]
  );

  const rangeValid = isValidDateRange(fechaDesde, fechaHasta);
  const isCustom = activePreset === 'custom';
  const showDateRow = !soloTurnoActual && (showDates || isCustom);

  const periodHint = soloTurnoActual
    ? cashSession
      ? `Turno desde ${formatDate(cashSession.fecha_apertura)}`
      : 'Sin caja abierta'
    : rangeValid
      ? fechaDesde === fechaHasta
        ? formatDateOnly(fechaDesde)
        : `${formatDateOnly(fechaDesde)} — ${formatDateOnly(fechaHasta)}`
      : 'Rango inválido';

  const handlePreset = (presetId) => {
    if (presetId === 'custom') {
      setShowDates(true);
      onPresetSelect('custom');
      return;
    }
    setShowDates(false);
    onPresetSelect(presetId);
  };

  const presetButtons = DATE_RANGE_PRESETS.filter((p) => MOBILE_PRESET_IDS.includes(p.id)).map(
    (preset) => (
      <button
        key={preset.id}
        type="button"
        onClick={() => handlePreset(preset.id)}
        disabled={loading}
        className={`${chipBase} ${activePreset === preset.id ? chipActive : chipIdle} disabled:opacity-50`}
      >
        <span className="sm:hidden">{mobilePresetLabel(preset.shortLabel)}</span>
        <span className="hidden sm:inline">{preset.shortLabel}</span>
      </button>
    )
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-1.5 text-slate-600 shrink-0">
          <CalendarRange className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-semibold uppercase tracking-wide">Período</span>
        </div>
        <p className="text-xs text-slate-500 text-right leading-snug min-w-0 flex-1">{periodHint}</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain scrollbar-none -mx-0.5 px-0.5 pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {presetButtons}

        <button
          type="button"
          onClick={() => handlePreset('custom')}
          disabled={loading}
          className={`${chipBase} ${isCustom ? 'bg-slate-800 text-white border-slate-800' : chipIdle}`}
        >
          Otro
        </button>

        <button
          type="button"
          onClick={onTurnoToggle}
          disabled={!cashSession || loading}
          title={
            cashSession
              ? 'Solo ventas del turno de caja abierto'
              : 'Abra la caja para usar este filtro'
          }
          className={`${chipBase} inline-flex items-center gap-1 ${
            soloTurnoActual ? 'bg-emerald-600 text-white border-emerald-600' : chipIdle
          } disabled:opacity-40`}
        >
          <Wallet className="w-3 h-3" />
          Turno
        </button>

        {!soloTurnoActual && (
          <button
            type="button"
            onClick={() => setShowDates((v) => !v)}
            className={`${chipBase} inline-flex items-center gap-0.5 ${
              showDateRow ? 'border-brand-400 bg-brand-50 text-brand-800' : chipIdle
            }`}
          >
            {showDateRow ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            Fechas
          </button>
        )}
      </div>

      {showDateRow && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <label className="sr-only" htmlFor="sales-fecha-desde">
            Desde
          </label>
          <input
            id="sales-fecha-desde"
            type="date"
            value={fechaDesde}
            max={fechaHasta || undefined}
            onChange={(e) => onDesdeChange(e.target.value)}
            className={dateInputClass}
          />
          <span className="text-slate-400 text-xs text-center hidden sm:inline">—</span>
          <label className="sr-only" htmlFor="sales-fecha-hasta">
            Hasta
          </label>
          <input
            id="sales-fecha-hasta"
            type="date"
            value={fechaHasta}
            min={fechaDesde || undefined}
            max={toLocalISODate()}
            onChange={(e) => onHastaChange(e.target.value)}
            className={dateInputClass}
          />
        </div>
      )}

      {soloTurnoActual && !cashSession && (
        <p className="text-xs text-amber-700 mt-3 pt-3 border-t border-slate-100">
          Sin caja abierta.{' '}
          <Link to="/caja" className="underline font-medium">
            Abrir caja
          </Link>
        </p>
      )}

      {!rangeValid && !soloTurnoActual && fechaDesde && fechaHasta && (
        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          «Desde» no puede ser posterior a «hasta».
        </p>
      )}
    </div>
  );
};

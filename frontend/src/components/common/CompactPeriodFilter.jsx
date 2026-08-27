import { useMemo, useState } from 'react';
import { CalendarRange, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import {
  DATE_RANGE_PRESETS,
  detectActivePreset,
  isValidDateRange,
  toLocalISODate,
} from '../../utils/dateRange';
import { formatDateOnly } from '../../utils/formatDate';

const chipBase =
  'shrink-0 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all touch-manipulation border whitespace-nowrap';

const chipActive = 'bg-brand-500 text-white border-brand-500';
const chipIdle = 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50';

const dateInputClass =
  'h-9 sm:h-8 w-full min-w-0 flex-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs ' +
  'focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500';

const DEFAULT_PRESET_IDS = ['today', 'last7', 'thisMonth', 'last30'];

const mobilePresetLabel = (label) => {
  const map = {
    Hoy: 'Hoy',
    '7 días': '7d',
    '30 días': '30d',
    'Este mes': 'Mes',
    'Mes ant.': 'Ant.',
    Ayer: 'Ayer',
    'Este año': 'Año',
  };
  return map[label] ?? label;
};

export const CompactPeriodFilter = ({
  fechaDesde,
  fechaHasta,
  onDesdeChange,
  onHastaChange,
  onPresetSelect,
  loading = false,
  label = 'Período',
  presetIds = DEFAULT_PRESET_IDS,
}) => {
  const [showDates, setShowDates] = useState(false);

  const activePreset = useMemo(
    () => detectActivePreset(fechaDesde, fechaHasta),
    [fechaDesde, fechaHasta]
  );

  const rangeValid = isValidDateRange(fechaDesde, fechaHasta);
  const isCustom = activePreset === 'custom';
  const showDateRow = showDates || isCustom;

  const periodHint = rangeValid
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

  const presets = DATE_RANGE_PRESETS.filter((p) => presetIds.includes(p.id));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm w-full">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-1.5 text-slate-600 shrink-0">
          <CalendarRange className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        </div>
        <p className="text-xs text-slate-500 text-right leading-snug min-w-0 flex-1">{periodHint}</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain scrollbar-none -mx-0.5 px-0.5 pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {presets.map((preset) => (
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
        ))}

        <button
          type="button"
          onClick={() => handlePreset('custom')}
          disabled={loading}
          className={`${chipBase} ${isCustom ? 'bg-slate-800 text-white border-slate-800' : chipIdle}`}
        >
          Rango
        </button>

        <button
          type="button"
          onClick={() => setShowDates((v) => !v)}
          className={`${chipBase} inline-flex items-center gap-0.5 ${
            showDateRow ? 'border-brand-400 bg-brand-50 text-brand-800' : chipIdle
          }`}
        >
          {showDateRow ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Fechas
        </button>
      </div>

      {showDateRow && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <label className="sr-only" htmlFor="period-fecha-desde">
            Desde
          </label>
          <input
            id="period-fecha-desde"
            type="date"
            value={fechaDesde}
            max={fechaHasta || undefined}
            onChange={(e) => onDesdeChange(e.target.value)}
            className={dateInputClass}
          />
          <span className="text-slate-400 text-xs text-center hidden sm:inline">—</span>
          <label className="sr-only" htmlFor="period-fecha-hasta">
            Hasta
          </label>
          <input
            id="period-fecha-hasta"
            type="date"
            value={fechaHasta}
            min={fechaDesde || undefined}
            max={toLocalISODate()}
            onChange={(e) => onHastaChange(e.target.value)}
            className={dateInputClass}
          />
        </div>
      )}

      {!rangeValid && fechaDesde && fechaHasta && (
        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          «Desde» no puede ser posterior a «hasta».
        </p>
      )}
    </div>
  );
};

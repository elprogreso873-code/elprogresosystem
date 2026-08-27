import { useMemo } from 'react';
import { CalendarRange, RefreshCw, AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  DATE_RANGE_PRESETS,
  detectActivePreset,
  isValidDateRange,
  getDaysInRange,
  toLocalISODate,
} from '../../utils/dateRange';
import { formatDateOnly } from '../../utils/formatDate';

export const DateRangeFilter = ({
  fechaDesde,
  fechaHasta,
  onDesdeChange,
  onHastaChange,
  onPresetSelect,
  onApply,
  loading = false,
  title = 'Período',
  subtitle,
  applyLabel = 'Aplicar',
  showApplyButton = true,
  extraPresets,
  children,
}) => {
  const activePreset = useMemo(
    () => detectActivePreset(fechaDesde, fechaHasta),
    [fechaDesde, fechaHasta]
  );

  const rangeValid = isValidDateRange(fechaDesde, fechaHasta);
  const dayCount = rangeValid ? getDaysInRange(fechaDesde, fechaHasta) : 0;

  const periodLabel =
    subtitle ||
    (rangeValid
      ? fechaDesde === fechaHasta
        ? formatDateOnly(fechaDesde, { style: 'long' })
        : `${formatDateOnly(fechaDesde)} — ${formatDateOnly(fechaHasta)}`
      : 'Seleccione un rango válido');

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-brand-50/30 p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
            <p className="text-sm text-slate-600 mt-0.5">{periodLabel}</p>
            {rangeValid && (
              <p className="text-xs text-slate-500 mt-1">
                {dayCount} día{dayCount !== 1 ? 's' : ''} incluido{dayCount !== 1 ? 's' : ''}
                {activePreset === 'custom' && ' · rango personalizado'}
              </p>
            )}
          </div>
        </div>
        {showApplyButton && (
          <Button
            onClick={onApply}
            disabled={loading || !rangeValid}
            isLoading={loading}
            className="w-full lg:w-auto shrink-0 min-h-11"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'opacity-0' : ''}`} />
            {applyLabel}
          </Button>
        )}
      </div>

      {children}

      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Accesos rápidos
        </p>
        <div className="flex flex-wrap gap-2">
          {DATE_RANGE_PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onPresetSelect(preset.id)}
                disabled={loading}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all touch-manipulation border ${
                  isActive
                    ? 'bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/25'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50/60'
                } disabled:opacity-50`}
              >
                {preset.shortLabel}
              </button>
            );
          })}
          {extraPresets}
          <button
            type="button"
            onClick={() => onPresetSelect('custom')}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-all border ${
              activePreset === 'custom'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Personalizado
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <Input
          id="fecha-desde"
          label="Fecha desde"
          type="date"
          size="lg"
          value={fechaDesde}
          max={fechaHasta || undefined}
          onChange={(e) => onDesdeChange(e.target.value)}
        />
        <Input
          id="fecha-hasta"
          label="Fecha hasta"
          type="date"
          size="lg"
          value={fechaHasta}
          min={fechaDesde || undefined}
          max={toLocalISODate()}
          onChange={(e) => onHastaChange(e.target.value)}
        />
      </div>

      {!rangeValid && fechaDesde && fechaHasta && (
        <p className="mt-3 text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          La fecha «desde» no puede ser posterior a «hasta».
        </p>
      )}
    </div>
  );
};

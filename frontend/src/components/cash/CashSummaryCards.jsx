import { Banknote, TrendingUp, Landmark, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export const CashSummaryCards = ({
  resumen,
  sesion,
  onShowIngresos,
  onShowEfectivo,
  readOnly = false,
}) => {
  if (!resumen || !sesion) return null;

  const efectivo = resumen.efectivo_fisico_esperado ?? sesion.efectivo_fisico_esperado;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <button
        type="button"
        onClick={onShowEfectivo}
        disabled={readOnly && !onShowEfectivo}
        className={`p-5 rounded-2xl border border-brand-200 bg-brand-50/80 text-left transition-colors ${
          onShowEfectivo ? 'hover:bg-brand-100/80 cursor-pointer' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Banknote className="w-4 h-4 text-brand-600" />
            Efectivo en caja
          </div>
          {onShowEfectivo && <ChevronRight className="w-4 h-4 text-brand-700 shrink-0" />}
        </div>
        <p className="text-2xl font-bold text-brand-800 mt-2">{formatCurrency(efectivo)}</p>
        <p className="text-xs text-slate-500 mt-1">
          {onShowEfectivo
            ? 'Toque para ver el detalle del efectivo'
            : `Apertura ${formatCurrency(resumen.monto_apertura ?? sesion.monto_apertura)} + mov. en efectivo − egresos`}
        </p>
      </button>

      <button
        type="button"
        onClick={onShowIngresos}
        disabled={readOnly && !onShowIngresos}
        className={`p-5 rounded-2xl border border-emerald-200 bg-emerald-50/80 text-left transition-colors ${
          onShowIngresos ? 'hover:bg-emerald-100/80 cursor-pointer' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Total ingresos del turno
          </div>
          {onShowIngresos && <ChevronRight className="w-4 h-4 text-emerald-700 shrink-0" />}
        </div>
        <p className="text-2xl font-bold text-emerald-800 mt-2">
          {formatCurrency(resumen.total_ingresos)}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {onShowIngresos ? 'Toque para ver detalle por método de pago' : 'Ventas + cobros CC + ingresos manuales'}
        </p>
      </button>

      <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/90">
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <Landmark className="w-4 h-4 text-slate-500" />
          Ventas en cuenta corriente
        </div>
        <p className="text-2xl font-bold text-slate-800 mt-2">
          {formatCurrency(resumen.total_ventas_cuenta_corriente)}
        </p>
        <p className="text-xs text-slate-500 mt-1">Solo referencia — no suma al arqueo de efectivo</p>
      </div>
    </div>
  );
};

import { Banknote, TrendingUp, Landmark, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatCashAmount } from '../../utils/formatCashAmount';
import { usePermissions } from '../../hooks/usePermissions';

export const CashSummaryCards = ({
  resumen,
  sesion,
  onShowIngresos,
  onShowEfectivo,
  readOnly = false,
}) => {
  const { isAdmin } = usePermissions();
  if (!resumen || !sesion) return null;

  const efectivo = resumen.efectivo_fisico_esperado ?? sesion.efectivo_fisico_esperado;
  const showAmounts = isAdmin;
  const money = (value) => formatCashAmount(value, showAmounts);
  const canShowEfectivo = showAmounts && onShowEfectivo;
  const canShowIngresos = showAmounts && onShowIngresos;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <button
        type="button"
        onClick={canShowEfectivo || undefined}
        disabled={readOnly && !canShowEfectivo}
        className={`p-5 rounded-2xl border border-brand-200 bg-brand-50/80 text-left transition-colors ${
          canShowEfectivo ? 'hover:bg-brand-100/80 cursor-pointer' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <Banknote className="w-4 h-4 text-brand-600" />
            Efectivo en caja
          </div>
          {canShowEfectivo && <ChevronRight className="w-4 h-4 text-brand-700 shrink-0" />}
        </div>
        <p className="text-2xl font-bold text-brand-800 mt-2">{money(efectivo)}</p>
        <p className="text-xs text-slate-500 mt-1">
          {canShowEfectivo
            ? 'Toque para ver el detalle del efectivo'
            : showAmounts
              ? `Apertura ${formatCurrency(resumen.monto_apertura ?? sesion.monto_apertura)} + mov. en efectivo − egresos`
              : 'Montos visibles solo para el administrador'}
        </p>
      </button>

      <button
        type="button"
        onClick={canShowIngresos || undefined}
        disabled={readOnly && !canShowIngresos}
        className={`p-5 rounded-2xl border border-emerald-200 bg-emerald-50/80 text-left transition-colors ${
          canShowIngresos ? 'hover:bg-emerald-100/80 cursor-pointer' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-600 text-sm">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Total ingresos del turno
          </div>
          {canShowIngresos && <ChevronRight className="w-4 h-4 text-emerald-700 shrink-0" />}
        </div>
        <p className="text-2xl font-bold text-emerald-800 mt-2">{money(resumen.total_ingresos)}</p>
        <p className="text-xs text-slate-500 mt-1">
          {canShowIngresos
            ? 'Toque para ver detalle por método de pago'
            : 'Ventas + cobros CC + ingresos manuales'}
        </p>
      </button>

      <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/90">
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <Landmark className="w-4 h-4 text-slate-500" />
          Ventas en cuenta corriente
        </div>
        <p className="text-2xl font-bold text-slate-800 mt-2">
          {money(resumen.total_ventas_cuenta_corriente)}
        </p>
        <p className="text-xs text-slate-500 mt-1">Solo referencia — no suma al arqueo de efectivo</p>
      </div>
    </div>
  );
};

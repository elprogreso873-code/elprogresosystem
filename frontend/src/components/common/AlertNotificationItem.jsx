import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Package, Wallet, X, ChevronRight } from 'lucide-react';
import { formatDateTime } from '../../utils/formatDate';
import { formatNumber } from '../../utils/formatCurrency';
import {
  buildStockAlertProductLink,
  buildStockAlertsLink,
  STOCK_ALERTS_PATH,
} from '../../utils/stockAlertLabels';

const iconByType = {
  stock_bajo: Package,
  caja_abierta_prolongada: Wallet,
};

const severityStyles = {
  alta: 'border-red-200 bg-red-50',
  media: 'border-amber-200 bg-amber-50',
};

export const AlertNotificationItem = ({
  alerta,
  onDismiss,
  onNavigate,
  compact = false,
}) => {
  const navigate = useNavigate();
  const Icon = iconByType[alerta.tipo] || AlertTriangle;
  const style = severityStyles[alerta.severidad] || severityStyles.media;

  const handleNavigate = (to) => {
    onNavigate?.();
    navigate(to);
  };

  const stockProducts = alerta.tipo === 'stock_bajo' ? alerta.datos?.productos || [] : [];

  return (
    <div className={`rounded-xl border p-3 ${style}`}>
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 shrink-0 mt-0.5 text-slate-700" aria-hidden />
        <div className="flex-1 min-w-0">
          {alerta.tipo === 'stock_bajo' ? (
            <button
              type="button"
              onClick={() => handleNavigate(buildStockAlertsLink('todos'))}
              className="w-full text-left group"
            >
              <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-700">
                {alerta.titulo}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">{alerta.mensaje}</p>
            </button>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-800">{alerta.titulo}</p>
              <p className="text-xs text-slate-600 mt-0.5">{alerta.mensaje}</p>
            </>
          )}

          {alerta.tipo === 'stock_bajo' && stockProducts.length > 0 && (
            <ul className="mt-2 space-y-1">
              {stockProducts.slice(0, compact ? 3 : 4).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handleNavigate(buildStockAlertProductLink(p.id, 'todos'))}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-white/80 hover:text-brand-700 transition-colors"
                  >
                    <span className="min-w-0 truncate">
                      <span className="font-medium">{p.nombre}</span>
                      <span className="text-slate-500">
                        {' '}
                        · {formatNumber(p.stock, 2)} / {formatNumber(p.stock_minimo, 2)}{' '}
                        {p.unidad_medida}
                      </span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />
                  </button>
                </li>
              ))}
              {alerta.datos?.cantidad > stockProducts.length && (
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate(buildStockAlertsLink('todos'))}
                    className="text-xs font-semibold text-brand-700 hover:underline px-2"
                  >
                    + {alerta.datos.cantidad - stockProducts.length} producto(s) más
                  </button>
                </li>
              )}
            </ul>
          )}

          {!compact && alerta.tipo === 'caja_abierta_prolongada' &&
            alerta.datos?.sesiones?.length > 0 && (
              <ul className="mt-2 text-xs text-slate-600 space-y-0.5">
                {alerta.datos.sesiones.slice(0, 3).map((s) => (
                  <li key={s.id}>
                    {s.usuario_nombre}: {s.horas_abierta} h ({formatDateTime(s.fecha_apertura)})
                  </li>
                ))}
              </ul>
            )}

          <div className="mt-2 flex flex-wrap gap-2">
            {alerta.tipo === 'stock_bajo' && (
              <button
                type="button"
                onClick={() => handleNavigate(STOCK_ALERTS_PATH)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
              >
                Ver alertas de stock
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
            {alerta.tipo === 'caja_abierta_prolongada' && (
              <Link
                to="/caja"
                onClick={onNavigate}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 underline"
              >
                Ir a caja
              </Link>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={() => onDismiss(alerta)}
            className="rounded p-1 text-slate-400 hover:bg-black/5 hover:text-slate-600"
            aria-label={`Ocultar ${alerta.titulo}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

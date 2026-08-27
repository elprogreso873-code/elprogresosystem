import { Link } from 'react-router-dom';
import { AlertTriangle, Package, Wallet, X } from 'lucide-react';
import { useSystemAlerts } from '../../hooks/useSystemAlerts';
import { formatDateTime } from '../../utils/formatDate';
import { formatNumber } from '../../utils/formatCurrency';

const iconByType = {
  stock_bajo: Package,
  caja_abierta_prolongada: Wallet,
};

const severityStyles = {
  alta: 'border-red-200 bg-red-50 text-red-900',
  media: 'border-amber-200 bg-amber-50 text-amber-900',
};

export const SystemAlertsPanel = ({ isOnline }) => {
  const { alertas, dismissAlert } = useSystemAlerts({ isOnline });

  if (!alertas.length) return null;

  return (
    <div className="space-y-3 mb-6" role="region" aria-label="Alertas del sistema">
      {alertas.map((alerta) => {
        const Icon = iconByType[alerta.tipo] || AlertTriangle;
        const style = severityStyles[alerta.severidad] || severityStyles.media;

        return (
          <div
            key={alerta.tipo}
            className={`rounded-xl border p-4 shadow-sm ${style}`}
          >
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{alerta.titulo}</p>
                <p className="text-sm mt-0.5 opacity-90">{alerta.mensaje}</p>

                {alerta.tipo === 'stock_bajo' && alerta.datos?.productos?.length > 0 && (
                  <ul className="mt-2 text-xs space-y-1">
                    {alerta.datos.productos.slice(0, 4).map((p) => (
                      <li key={p.id}>
                        {p.nombre}: {formatNumber(p.stock, 2)} / {formatNumber(p.stock_minimo, 2)}{' '}
                        {p.unidad_medida}
                      </li>
                    ))}
                    {alerta.datos.cantidad > 4 && (
                      <li className="font-medium">+ {alerta.datos.cantidad - 4} más…</li>
                    )}
                  </ul>
                )}

                {alerta.tipo === 'caja_abierta_prolongada' &&
                  alerta.datos?.sesiones?.length > 0 && (
                    <ul className="mt-2 text-xs space-y-1">
                      {alerta.datos.sesiones.slice(0, 3).map((s) => (
                        <li key={s.id}>
                          {s.usuario_nombre}: {s.horas_abierta} h abierta (desde{' '}
                          {formatDateTime(s.fecha_apertura)})
                        </li>
                      ))}
                    </ul>
                  )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {alerta.tipo === 'stock_bajo' && (
                    <Link
                      to="/reports"
                      className="text-xs font-semibold underline underline-offset-2"
                    >
                      Ver reporte de stock
                    </Link>
                  )}
                  {alerta.tipo === 'caja_abierta_prolongada' && (
                    <Link
                      to="/cash"
                      className="text-xs font-semibold underline underline-offset-2"
                    >
                      Ir a caja
                    </Link>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismissAlert(alerta)}
                className="rounded-lg p-1 opacity-70 hover:opacity-100 hover:bg-black/5"
                aria-label={`Ocultar alerta: ${alerta.titulo}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

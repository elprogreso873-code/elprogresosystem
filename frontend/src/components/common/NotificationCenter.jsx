import { useEffect, useRef, useState } from 'react';
import { Bell, RefreshCw, Settings2 } from 'lucide-react';
import { DecimalInput } from '../ui/DecimalInput';
import { useAlerts } from '../../context/AlertsContext';
import { useConnection } from '../../context/ConnectionContext';
import {
  ALERT_UMBRAL_MIN,
  ALERT_UMBRAL_MAX,
  ALERT_UMBRAL_DEFAULT,
} from '../../utils/alertPreferences';
import { AlertNotificationItem } from './AlertNotificationItem';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

export const NotificationCenter = () => {
  const {
    alertas,
    loading,
    error,
    umbralHoras,
    updateUmbralHoras,
    resetUmbralHoras,
    refresh,
    dismissAlert,
    alertCount,
  } = useAlerts();
  const { isOffline } = useConnection();

  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draftUmbral, setDraftUmbral] = useState(umbralHoras);
  const containerRef = useRef(null);

  useEffect(() => {
    setDraftUmbral(umbralHoras);
  }, [umbralHoras]);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setShowSettings(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSaveUmbral = () => {
    updateUmbralHoras(draftUmbral);
    setShowSettings(false);
  };

  const badgeLabel = alertCount > 9 ? '9+' : String(alertCount);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        aria-label="Notificaciones del sistema"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {alertCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          role="dialog"
          aria-label="Panel de notificaciones"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Notificaciones</p>
              <p className="text-xs text-slate-500">
                {isOffline ? 'Sin conexión — datos no actualizados' : 'Alertas del sistema'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSettings((prev) => !prev)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Configurar umbral de caja"
                title="Umbral caja abierta"
              >
                <Settings2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={refresh}
                disabled={loading || isOffline}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                aria-label="Actualizar notificaciones"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Umbral caja abierta (horas)
              </p>
              <div className="flex items-center gap-2">
                <DecimalInput
                  bare
                  decimals={0}
                  min={ALERT_UMBRAL_MIN}
                  max={ALERT_UMBRAL_MAX}
                  emptyZero={false}
                  fallbackOnBlur={ALERT_UMBRAL_DEFAULT}
                  value={draftUmbral}
                  onChange={setDraftUmbral}
                  className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-sm"
                />
                <Button size="sm" onClick={handleSaveUmbral}>
                  Guardar
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    resetUmbralHoras();
                    setShowSettings(false);
                  }}
                  className="text-xs text-slate-500 underline hover:text-slate-700"
                >
                  Restaurar ({ALERT_UMBRAL_DEFAULT} h)
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Entre {ALERT_UMBRAL_MIN} y {ALERT_UMBRAL_MAX} horas. Se guarda en este dispositivo.
              </p>
            </div>
          )}

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto p-3 space-y-2">
            {loading && alertas.length === 0 && (
              <div className="flex justify-center py-8">
                <Spinner className="w-6 h-6" />
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
            )}

            {!loading && !error && alertas.length === 0 && (
              <div className="py-8 text-center">
                <Bell className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm text-slate-600">Sin alertas por ahora</p>
                <p className="text-xs text-slate-400">Stock bajo y caja abierta prolongada</p>
              </div>
            )}

            {alertas.map((alerta) => (
              <AlertNotificationItem
                key={alerta.tipo}
                alerta={alerta}
                onDismiss={dismissAlert}
                onNavigate={() => {
                  setOpen(false);
                  setShowSettings(false);
                }}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

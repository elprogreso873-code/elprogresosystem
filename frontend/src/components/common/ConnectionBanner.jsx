import { useEffect, useState } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export const ConnectionBanner = ({
  isOnline,
  isOffline,
  isChecking,
  wasOffline,
  onRefresh,
  onAcknowledgeReconnected,
}) => {
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        onAcknowledgeReconnected?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOnline, wasOffline, onAcknowledgeReconnected]);

  if (isChecking && !isOffline && !showReconnected) return null;

  if (isOffline) {
    return (
      <div
        role="alert"
        className="shrink-0 z-50 flex items-center justify-between gap-3 border-b border-red-200 bg-red-600 px-4 py-2.5 text-white shadow-md"
      >
        <div className="flex items-center gap-2 min-w-0">
          <WifiOff className="h-5 w-5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="font-semibold text-sm">Sin conexión</p>
            <p className="text-xs text-red-100 truncate">
              No podés registrar ventas, caja ni inventario hasta recuperar internet.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="!border-red-200 !text-white hover:!bg-red-700 shrink-0"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div
        role="status"
        className="shrink-0 z-50 flex items-center gap-2 border-b border-emerald-200 bg-emerald-600 px-4 py-2.5 text-white shadow-sm"
      >
        <Wifi className="h-5 w-5 shrink-0" aria-hidden />
        <p className="text-sm font-medium">Conexión restablecida — ya podés operar con normalidad.</p>
      </div>
    );
  }

  return null;
};

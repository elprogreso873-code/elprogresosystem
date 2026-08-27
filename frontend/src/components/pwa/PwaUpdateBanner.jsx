import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { BRAND_NAME } from '../../config/brand';

export const PWA_UPDATE_EVENT = 'el-progreso:pwa-update-available';

export const PwaUpdateBanner = () => {
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [applyUpdate, setApplyUpdate] = useState(null);

  useEffect(() => {
    const handler = (event) => {
      setApplyUpdate(() => event.detail?.applyUpdate ?? null);
      setVisible(true);
    };

    window.addEventListener(PWA_UPDATE_EVENT, handler);
    return () => window.removeEventListener(PWA_UPDATE_EVENT, handler);
  }, []);

  if (!visible) return null;

  const handleUpdate = async () => {
    if (!applyUpdate) return;
    setUpdating(true);
    try {
      await applyUpdate(true);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      role="alert"
      className="fixed z-[60] mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-lg left-[max(1rem,env(safe-area-inset-left,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] top-[max(1rem,env(safe-area-inset-top,0px))] sm:left-auto sm:right-[max(1.5rem,env(safe-area-inset-right,0px))]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <RefreshCw className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">Nueva versión disponible</p>
          <p className="mt-1 text-sm text-slate-600">
            Hay actualizaciones de {BRAND_NAME} listas para aplicar.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={handleUpdate} isLoading={updating}>
              Actualizar ahora
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setVisible(false)}>
              Después
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setVisible(false)}
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-amber-100 hover:text-slate-600"
          aria-label="Cerrar aviso de actualización"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Download, Share, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Button } from '../ui/Button';
import { BRAND_NAME } from '../../config/brand';

const DISMISS_KEY = 'el-progreso_pwa_install_dismissed';

export const PwaInstallBanner = () => {
  const { canInstallNative, canShowIosHint, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [installing, setInstalling] = useState(false);

  if (isInstalled || dismissed || (!canInstallNative && !canShowIosHint)) {
    return null;
  }

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div
      role="status"
      className="fixed z-50 mx-auto max-w-lg rounded-xl border border-brand-200 bg-white p-4 shadow-lg left-[max(1rem,env(safe-area-inset-left,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] bottom-[max(1rem,env(safe-area-inset-bottom,0px))] sm:left-auto sm:right-[max(1.5rem,env(safe-area-inset-right,0px))]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
          {canShowIosHint ? <Smartphone className="h-5 w-5" /> : <Download className="h-5 w-5" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">Instalá {BRAND_NAME}</p>
          {canShowIosHint ? (
            <p className="mt-1 text-sm text-slate-600">
              En Safari: tocá <Share className="inline h-4 w-4 align-text-bottom" /> Compartir y elegí{' '}
              <strong>Agregar a inicio</strong> para usarla como app.
            </p>
          ) : (
            <p className="mt-1 text-sm text-slate-600">
              Accedé más rápido desde tu escritorio o celular, como una aplicación nativa.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {canInstallNative && (
              <Button size="sm" onClick={handleInstall} isLoading={installing}>
                Instalar ahora
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Ahora no
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Cerrar aviso de instalación"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

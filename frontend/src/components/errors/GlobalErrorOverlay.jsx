import { useErrorStore } from '../../store/errorStore';
import { AppErrorFallback } from './AppErrorFallback';

export const GlobalErrorOverlay = () => {
  const globalError = useErrorStore((s) => s.globalError);
  const clearGlobalError = useErrorStore((s) => s.clearGlobalError);

  if (!globalError) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-100/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <AppErrorFallback
          error={globalError}
          title="Error en la aplicación"
          description={globalError.message}
          onRetry={clearGlobalError}
          compact
          showLogo={false}
        />
      </div>
    </div>
  );
};

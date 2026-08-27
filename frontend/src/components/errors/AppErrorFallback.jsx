import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Logo } from '../common/Logo';
import { goToHome, reloadApplication } from '../../utils/globalErrors';

const getErrorMessage = (error) => {
  if (!error) return 'Ocurrió un error inesperado en la aplicación.';
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  return 'Ocurrió un error inesperado en la aplicación.';
};

export const AppErrorFallback = ({
  error,
  title = 'Algo salió mal',
  description,
  onRetry,
  compact = false,
  showLogo = true,
}) => {
  const message = description || getErrorMessage(error);
  const showDetail = import.meta.env.DEV && error?.stack;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'p-6 py-12' : 'min-h-[50vh] p-6 sm:p-10'
      }`}
    >
      {showLogo && !compact && (
        <div className="mb-8">
          <Logo size="sm" />
        </div>
      )}

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{title}</h1>
      <p className="text-slate-600 mt-2 max-w-md text-sm sm:text-base">{message}</p>

      {showDetail && (
        <pre className="mt-4 max-w-full overflow-x-auto rounded-xl bg-slate-100 p-3 text-left text-xs text-slate-600 max-h-32">
          {error.stack}
        </pre>
      )}

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-6 w-full sm:w-auto justify-center">
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="w-full sm:w-auto min-h-11">
            <RotateCcw className="w-4 h-4" />
            Reintentar
          </Button>
        )}
        <Button onClick={reloadApplication} className="w-full sm:w-auto min-h-11">
          <RefreshCw className="w-4 h-4" />
          Recargar aplicación
        </Button>
        <Button variant="ghost" onClick={goToHome} className="w-full sm:w-auto min-h-11">
          <Home className="w-4 h-4" />
          Ir al inicio
        </Button>
      </div>

      <p className="text-xs text-slate-500 mt-6 max-w-sm">
        Si el problema continúa, recargue la aplicación. En la versión instalada (PWA) use
        «Recargar aplicación» en lugar del navegador.
      </p>
    </div>
  );
};

import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AppErrorFallback } from '../components/errors/AppErrorFallback';

export const RouterErrorPage = () => {
  const error = useRouteError();

  let description = 'No se pudo cargar esta sección de la aplicación.';
  if (isRouteErrorResponse(error)) {
    description = error.statusText || description;
  } else if (error instanceof Error) {
    description = error.message;
  }

  return (
    <AppErrorFallback
      error={error instanceof Error ? error : null}
      title="Error de navegación"
      description={description}
    />
  );
};

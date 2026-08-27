import { useErrorStore } from '../store/errorStore';

export const reloadApplication = () => {
  window.location.reload();
};

export const goToHome = () => {
  const base = import.meta.env.BASE_URL || '/';
  const path = base.endsWith('/') ? `${base}dashboard` : `${base}/dashboard`;
  window.location.assign(`${window.location.origin}${path}`);
};

export const setupGlobalErrorHandlers = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[unhandledrejection]', event.reason);
    useErrorStore.getState().reportError(event.reason);
  });

  window.addEventListener('error', (event) => {
    console.error('[window.error]', event.error || event.message);
    useErrorStore.getState().reportError(event.error || event.message);
  });
};

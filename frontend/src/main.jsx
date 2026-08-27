import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.jsx';
import { setupGlobalErrorHandlers } from './utils/globalErrors';
import { purgeLegacyApiCaches } from './utils/pwaCache';
import { PWA_UPDATE_EVENT } from './components/pwa/PwaUpdateBanner.jsx';

setupGlobalErrorHandlers();
purgeLegacyApiCaches();

let refreshingForSw = false;

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshingForSw) return;
    refreshingForSw = true;
    window.location.reload();
  });
}

const scheduleSwUpdateChecks = (registration) => {
  const checkForUpdates = () => {
    registration.update().catch(() => {});
  };

  checkForUpdates();
  setInterval(checkForUpdates, 15 * 60 * 1000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdates();
  });

  window.addEventListener('focus', checkForUpdates);
};

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(
      new CustomEvent(PWA_UPDATE_EVENT, {
        detail: { applyUpdate: updateSW },
      })
    );

    const isStandalonePwa =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalonePwa) {
      void updateSW(true);
    }
  },
  onOfflineReady() {
    console.info('[PWA] Interfaz lista para uso sin conexión (los datos de ventas siempre se consultan en línea).');
  },
  onRegisteredSW(_swUrl, registration) {
    if (registration) scheduleSwUpdateChecks(registration);
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

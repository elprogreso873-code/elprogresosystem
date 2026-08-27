import { AppRouter } from './routes/AppRouter';
import { AppErrorBoundary } from './components/errors/AppErrorBoundary';
import { GlobalErrorOverlay } from './components/errors/GlobalErrorOverlay';
import { PwaInstallBanner } from './components/pwa/PwaInstallBanner';
import { PwaUpdateBanner } from './components/pwa/PwaUpdateBanner';

function App() {
  return (
    <AppErrorBoundary showLogo>
      <AppRouter />
      <GlobalErrorOverlay />
      <PwaUpdateBanner />
      <PwaInstallBanner />
    </AppErrorBoundary>
  );
}

export default App;

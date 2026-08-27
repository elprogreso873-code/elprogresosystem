import { useCallback, useEffect, useRef, useState } from 'react';
import { env } from '../config/env.js';

const CHECK_INTERVAL_MS = 25_000;
const HEALTH_TIMEOUT_MS = 6_000;

const resolveHealthUrl = () => {
  if (env.apiUrl.startsWith('http')) {
    return env.apiUrl.replace(/\/api\/v1\/?$/, '/health');
  }
  return `${window.location.origin}/health`;
};

export const useConnectionStatus = () => {
  const [status, setStatus] = useState('checking');
  const [lastCheckedAt, setLastCheckedAt] = useState(null);
  const [wasOffline, setWasOffline] = useState(false);
  const checkingRef = useRef(false);

  const pingServer = useCallback(async () => {
    if (checkingRef.current) return;
    if (!navigator.onLine) {
      setStatus('offline');
      setWasOffline(true);
      return;
    }

    checkingRef.current = true;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

      const response = await fetch(resolveHealthUrl(), {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        setStatus('offline');
        setWasOffline(true);
      } else {
        setStatus((prev) => {
          if (prev === 'offline') setWasOffline(true);
          return 'online';
        });
      }
    } catch {
      setStatus('offline');
      setWasOffline(true);
    } finally {
      setLastCheckedAt(Date.now());
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const onBrowserOnline = () => {
      setStatus('checking');
      pingServer();
    };
    const onBrowserOffline = () => {
      setStatus('offline');
      setWasOffline(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') pingServer();
    };

    pingServer();

    window.addEventListener('online', onBrowserOnline);
    window.addEventListener('offline', onBrowserOffline);
    document.addEventListener('visibilitychange', onVisibility);

    const intervalId = setInterval(pingServer, CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener('online', onBrowserOnline);
      window.removeEventListener('offline', onBrowserOffline);
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(intervalId);
    };
  }, [pingServer]);

  const acknowledgeReconnected = useCallback(() => {
    setWasOffline(false);
  }, []);

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isChecking: status === 'checking',
    wasOffline,
    lastCheckedAt,
    refresh: pingServer,
    acknowledgeReconnected,
  };
};

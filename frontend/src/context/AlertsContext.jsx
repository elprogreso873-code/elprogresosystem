import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { alertService } from '../services/alertService';
import { useAuthStore } from '../store/authStore';
import {
  getUmbralHoras,
  setUmbralHoras as persistUmbralHoras,
  ALERT_UMBRAL_DEFAULT,
} from '../utils/alertPreferences';
import {
  applyAlertDismissals,
  dismissCashSessions,
  dismissStockProducts,
  extractActiveAlertIds,
  loadDismissals,
  pruneDismissals,
} from '../utils/alertDismissals';
import { useConnection } from './ConnectionContext';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

const AlertsContext = createContext(null);

export const AlertsProvider = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const { isOnline } = useConnection();

  const [rawAlertas, setRawAlertas] = useState([]);
  const [dismissals, setDismissals] = useState(() => emptyDismissals());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [umbralHoras, setUmbralHorasState] = useState(getUmbralHoras);

  useEffect(() => {
    if (userId) {
      setDismissals(loadDismissals(userId));
    } else {
      setDismissals({ stockProducts: [], cashSessions: [] });
    }
  }, [userId]);

  const visibleAlertas = useMemo(
    () => applyAlertDismissals(rawAlertas, dismissals),
    [rawAlertas, dismissals]
  );

  const loadAlerts = useCallback(async () => {
    if (!isAuthenticated || !isOnline) return;

    setLoading(true);
    setError('');
    try {
      const data = await alertService.list({ umbral_horas: umbralHoras });
      setRawAlertas(data);

      if (userId) {
        const { activeStockProductIds, activeCashSessionIds } = extractActiveAlertIds(data);
        setDismissals((prev) =>
          pruneDismissals(userId, { activeStockProductIds, activeCashSessionIds }, prev)
        );
      }
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar las notificaciones');
      setRawAlertas([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isOnline, umbralHoras, userId]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    if (!isAuthenticated || !isOnline) return undefined;
    const intervalId = setInterval(loadAlerts, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, isOnline, loadAlerts]);

  const dismissAlert = useCallback(
    (alerta) => {
      if (!userId || !alerta) return;

      if (alerta.tipo === 'stock_bajo') {
        const productIds =
          alerta.datos?.producto_ids || alerta.datos?.productos?.map((p) => p.id) || [];
        setDismissals((prev) => dismissStockProducts(userId, productIds, prev));
        return;
      }

      if (alerta.tipo === 'caja_abierta_prolongada') {
        const sessionIds =
          alerta.datos?.sesion_ids || alerta.datos?.sesiones?.map((s) => s.id) || [];
        setDismissals((prev) => dismissCashSessions(userId, sessionIds, prev));
      }
    },
    [userId]
  );

  const updateUmbralHoras = useCallback((hours) => {
    const normalized = persistUmbralHoras(hours);
    setUmbralHorasState(normalized);
    return normalized;
  }, []);

  const resetUmbralHoras = useCallback(() => {
    return updateUmbralHoras(ALERT_UMBRAL_DEFAULT);
  }, [updateUmbralHoras]);

  return (
    <AlertsContext.Provider
      value={{
        alertas: visibleAlertas,
        allAlertas: rawAlertas,
        loading,
        error,
        umbralHoras,
        updateUmbralHoras,
        resetUmbralHoras,
        refresh: loadAlerts,
        dismissAlert,
        hasAlerts: visibleAlertas.length > 0,
        alertCount: visibleAlertas.length,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
};

function emptyDismissals() {
  return { stockProducts: [], cashSessions: [] };
}

export const useAlerts = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts debe usarse dentro de AlertsProvider');
  }
  return context;
};

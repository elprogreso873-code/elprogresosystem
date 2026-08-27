import { useCallback, useEffect, useMemo, useState } from 'react';
import { alertService } from '../services/alertService';
import { useAuthStore } from '../store/authStore';
import {
  applyAlertDismissals,
  dismissCashSessions,
  dismissStockProducts,
  extractActiveAlertIds,
  loadDismissals,
  pruneDismissals,
} from '../utils/alertDismissals';

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export const useSystemAlerts = ({ enabled = true, isOnline = true } = {}) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const [rawAlertas, setRawAlertas] = useState([]);
  const [dismissals, setDismissals] = useState(() => ({ stockProducts: [], cashSessions: [] }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) setDismissals(loadDismissals(userId));
  }, [userId]);

  const alertas = useMemo(
    () => applyAlertDismissals(rawAlertas, dismissals),
    [rawAlertas, dismissals]
  );

  const loadAlerts = useCallback(async () => {
    if (!enabled || !isAuthenticated || !isOnline) return;

    setLoading(true);
    setError('');
    try {
      const data = await alertService.list();
      setRawAlertas(data);
      if (userId) {
        const { activeStockProductIds, activeCashSessionIds } = extractActiveAlertIds(data);
        setDismissals((prev) =>
          pruneDismissals(userId, { activeStockProductIds, activeCashSessionIds }, prev)
        );
      }
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar las alertas');
      setRawAlertas([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, isAuthenticated, isOnline, userId]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !isOnline) return undefined;

    const intervalId = setInterval(loadAlerts, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [enabled, isAuthenticated, isOnline, loadAlerts]);

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

  return {
    alertas,
    loading,
    error,
    refresh: loadAlerts,
    dismissAlert,
    hasAlerts: alertas.length > 0,
  };
};

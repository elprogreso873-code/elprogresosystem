const storageKey = (userId) => `el-progreso-alert-dismissals-${userId}`;

const emptyDismissals = () => ({
  stockProducts: [],
  cashSessions: [],
});

const normalizeIds = (ids) =>
  [...new Set((ids || []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))];

export const loadDismissals = (userId) => {
  if (!userId) return emptyDismissals();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return emptyDismissals();
    const parsed = JSON.parse(raw);
    return {
      stockProducts: normalizeIds(parsed?.stockProducts),
      cashSessions: normalizeIds(parsed?.cashSessions),
    };
  } catch {
    return emptyDismissals();
  }
};

const saveDismissals = (userId, state) => {
  if (!userId) return state;
  localStorage.setItem(storageKey(userId), JSON.stringify(state));
  return state;
};

export const dismissStockProducts = (userId, productIds, current = null) => {
  const state = current || loadDismissals(userId);
  const merged = new Set([...state.stockProducts, ...normalizeIds(productIds)]);
  return saveDismissals(userId, { ...state, stockProducts: [...merged] });
};

export const dismissCashSessions = (userId, sessionIds, current = null) => {
  const state = current || loadDismissals(userId);
  const merged = new Set([...state.cashSessions, ...normalizeIds(sessionIds)]);
  return saveDismissals(userId, { ...state, cashSessions: [...merged] });
};

/**
 * Quita descartes de productos reabastecidos o sesiones de caja ya cerradas.
 */
export const pruneDismissals = (userId, { activeStockProductIds = [], activeCashSessionIds = [] }, current = null) => {
  const state = current || loadDismissals(userId);
  const activeStock = new Set(normalizeIds(activeStockProductIds));
  const activeCash = new Set(normalizeIds(activeCashSessionIds));

  return saveDismissals(userId, {
    stockProducts: state.stockProducts.filter((id) => activeStock.has(id)),
    cashSessions: state.cashSessions.filter((id) => activeCash.has(id)),
  });
};

export const extractActiveAlertIds = (alertas) => {
  let activeStockProductIds = [];
  let activeCashSessionIds = [];

  for (const alerta of alertas) {
    if (alerta.tipo === 'stock_bajo') {
      activeStockProductIds =
        alerta.datos?.producto_ids || alerta.datos?.productos?.map((p) => p.id) || [];
    }
    if (alerta.tipo === 'caja_abierta_prolongada') {
      activeCashSessionIds = alerta.datos?.sesiones?.map((s) => s.id) || [];
    }
  }

  return { activeStockProductIds, activeCashSessionIds };
};

export const applyAlertDismissals = (alertas, dismissals) => {
  const dismissedStock = new Set(dismissals?.stockProducts || []);
  const dismissedCash = new Set(dismissals?.cashSessions || []);

  return alertas
    .map((alerta) => {
      if (alerta.tipo === 'stock_bajo') {
        const allIds =
          alerta.datos?.producto_ids || alerta.datos?.productos?.map((p) => p.id) || [];
        const remainingIds = allIds.filter((id) => !dismissedStock.has(id));
        if (remainingIds.length === 0) return null;

        const remainingSet = new Set(remainingIds);
        const productos = (alerta.datos?.productos || []).filter((p) => remainingSet.has(p.id));

        return {
          ...alerta,
          severidad: remainingIds.length >= 5 ? 'alta' : 'media',
          mensaje: `${remainingIds.length} producto(s) en o por debajo del stock mínimo`,
          datos: {
            ...alerta.datos,
            cantidad: remainingIds.length,
            producto_ids: remainingIds,
            productos,
          },
        };
      }

      if (alerta.tipo === 'caja_abierta_prolongada') {
        const sesiones = (alerta.datos?.sesiones || []).filter((s) => !dismissedCash.has(s.id));
        if (sesiones.length === 0) return null;

        return {
          ...alerta,
          severidad: sesiones.some((s) => s.horas_abierta >= 24) ? 'alta' : 'media',
          mensaje: `${sesiones.length} turno(s) de caja llevan más de ${alerta.datos?.umbral_horas} h abiertos`,
          datos: {
            ...alerta.datos,
            cantidad: sesiones.length,
            sesion_ids: sesiones.map((s) => s.id),
            sesiones,
          },
        };
      }

      return alerta;
    })
    .filter(Boolean);
};

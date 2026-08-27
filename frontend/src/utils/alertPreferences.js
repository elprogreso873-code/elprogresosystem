const STORAGE_KEY = 'el-progreso-alert-prefs';
const DEFAULT_UMBRAL_HORAS = 12;
const MIN_UMBRAL = 4;
const MAX_UMBRAL = 72;

export const ALERT_UMBRAL_MIN = MIN_UMBRAL;
export const ALERT_UMBRAL_MAX = MAX_UMBRAL;
export const ALERT_UMBRAL_DEFAULT = DEFAULT_UMBRAL_HORAS;

const readPrefs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { umbralHoras: DEFAULT_UMBRAL_HORAS };
    const parsed = JSON.parse(raw);
    const umbral = Number(parsed?.umbralHoras);
    if (!Number.isFinite(umbral)) return { umbralHoras: DEFAULT_UMBRAL_HORAS };
    return {
      umbralHoras: Math.min(MAX_UMBRAL, Math.max(MIN_UMBRAL, Math.round(umbral))),
    };
  } catch {
    return { umbralHoras: DEFAULT_UMBRAL_HORAS };
  }
};

export const getUmbralHoras = () => readPrefs().umbralHoras;

export const setUmbralHoras = (value) => {
  const umbralHoras = Math.min(
    MAX_UMBRAL,
    Math.max(MIN_UMBRAL, Math.round(Number(value) || DEFAULT_UMBRAL_HORAS))
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ umbralHoras }));
  return umbralHoras;
};

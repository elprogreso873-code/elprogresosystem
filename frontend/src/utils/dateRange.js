/** Fecha local en YYYY-MM-DD (evita desfase por UTC al parsear solo fecha) */
export const toLocalISODate = (date = new Date()) => {
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  }

  const d = date instanceof Date ? date : null;
  if (!d || Number.isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfMonth = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfMonth = (date = new Date()) => {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const DATE_RANGE_PRESETS = [
  {
    id: 'today',
    label: 'Hoy',
    shortLabel: 'Hoy',
    getRange: () => {
      const t = startOfDay();
      return { fecha_desde: toLocalISODate(t), fecha_hasta: toLocalISODate(t) };
    },
  },
  {
    id: 'yesterday',
    label: 'Ayer',
    shortLabel: 'Ayer',
    getRange: () => {
      const y = addDays(startOfDay(), -1);
      return { fecha_desde: toLocalISODate(y), fecha_hasta: toLocalISODate(y) };
    },
  },
  {
    id: 'last7',
    label: 'Últimos 7 días',
    shortLabel: '7 días',
    getRange: () => {
      const hasta = startOfDay();
      const desde = addDays(hasta, -6);
      return { fecha_desde: toLocalISODate(desde), fecha_hasta: toLocalISODate(hasta) };
    },
  },
  {
    id: 'last30',
    label: 'Últimos 30 días',
    shortLabel: '30 días',
    getRange: () => {
      const hasta = startOfDay();
      const desde = addDays(hasta, -29);
      return { fecha_desde: toLocalISODate(desde), fecha_hasta: toLocalISODate(hasta) };
    },
  },
  {
    id: 'thisMonth',
    label: 'Este mes',
    shortLabel: 'Este mes',
    getRange: () => {
      const t = startOfDay();
      return {
        fecha_desde: toLocalISODate(startOfMonth(t)),
        fecha_hasta: toLocalISODate(t),
      };
    },
  },
  {
    id: 'lastMonth',
    label: 'Mes anterior',
    shortLabel: 'Mes ant.',
    getRange: () => {
      const t = startOfDay();
      const prev = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      return {
        fecha_desde: toLocalISODate(startOfMonth(prev)),
        fecha_hasta: toLocalISODate(endOfMonth(prev)),
      };
    },
  },
  {
    id: 'thisYear',
    label: 'Este año',
    shortLabel: 'Este año',
    getRange: () => {
      const t = startOfDay();
      const desde = new Date(t.getFullYear(), 0, 1);
      return { fecha_desde: toLocalISODate(desde), fecha_hasta: toLocalISODate(t) };
    },
  },
];

/** Rango por defecto reportes: últimos 30 días */
export const getDefaultDateRange = () => {
  const preset = DATE_RANGE_PRESETS.find((p) => p.id === 'last30');
  return preset ? preset.getRange() : DATE_RANGE_PRESETS[3].getRange();
};

/** Rango por defecto listado de ventas: hoy */
export const getDefaultSalesDateRange = () => {
  const preset = DATE_RANGE_PRESETS.find((p) => p.id === 'today');
  return preset ? preset.getRange() : DATE_RANGE_PRESETS[0].getRange();
};

/** Rango por defecto inventario: últimos 7 días */
export const getDefaultInventoryDateRange = () => {
  const preset = DATE_RANGE_PRESETS.find((p) => p.id === 'last7');
  return preset ? preset.getRange() : DATE_RANGE_PRESETS[2].getRange();
};

export const getPresetRange = (presetId) => {
  const preset = DATE_RANGE_PRESETS.find((p) => p.id === presetId);
  return preset ? preset.getRange() : getDefaultDateRange();
};

export const detectActivePreset = (fechaDesde, fechaHasta) => {
  if (!fechaDesde || !fechaHasta) return null;
  for (const preset of DATE_RANGE_PRESETS) {
    const range = preset.getRange();
    if (range.fecha_desde === fechaDesde && range.fecha_hasta === fechaHasta) {
      return preset.id;
    }
  }
  return 'custom';
};

export const isValidDateRange = (fechaDesde, fechaHasta) => {
  if (!fechaDesde || !fechaHasta) return false;
  return fechaDesde <= fechaHasta;
};

export const getDaysInRange = (fechaDesde, fechaHasta) => {
  if (!isValidDateRange(fechaDesde, fechaHasta)) return 0;
  const [y1, m1, d1] = fechaDesde.split('-').map(Number);
  const [y2, m2, d2] = fechaHasta.split('-').map(Number);
  const desde = new Date(y1, m1 - 1, d1);
  const hasta = new Date(y2, m2 - 1, d2);
  const diff = hasta.getTime() - desde.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};

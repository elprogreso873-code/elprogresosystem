export const STOCK_ALERT_FILTERS = [
  { value: 'todos', label: 'Todos', description: 'Stock en o por debajo del mínimo' },
  { value: 'bajo', label: 'Stock bajo', description: 'Por debajo del mínimo con unidades' },
  { value: 'sin_stock', label: 'Sin stock', description: 'Stock en cero' },
  { value: 'negativo', label: 'Negativo', description: 'Stock por debajo de cero' },
  { value: 'critico', label: 'Crítico', description: 'Por debajo del mínimo configurado' },
];

export const STOCK_ALERT_TYPE_LABELS = {
  bajo: 'Stock bajo',
  sin_stock: 'Sin stock',
  negativo: 'Negativo',
  critico: 'Crítico',
};

export const STOCK_ALERT_TYPE_STYLES = {
  bajo: 'bg-amber-100 text-amber-800',
  sin_stock: 'bg-red-100 text-red-800',
  negativo: 'bg-red-200 text-red-900',
  critico: 'bg-orange-100 text-orange-900',
};

export const STOCK_ALERTS_PATH = '/catalogo/alertas-stock';

export const buildStockAlertProductLink = (productoId, filtro = 'todos') =>
  `${STOCK_ALERTS_PATH}?producto=${productoId}&filtro=${filtro}`;

export const buildStockAlertsLink = (filtro = 'todos') =>
  filtro === 'todos' ? STOCK_ALERTS_PATH : `${STOCK_ALERTS_PATH}?filtro=${filtro}`;

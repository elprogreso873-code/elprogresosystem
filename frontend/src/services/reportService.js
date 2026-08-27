import { api } from '../api/axios';

export const reportService = {
  dashboard: async (params) => {
    const { data } = await api.get('/reports/dashboard', { params });
    return data.data.reporte;
  },
  salesByDay: async (params) => {
    const { data } = await api.get('/reports/sales-by-day', { params });
    return data.data.datos;
  },
  topProducts: async (params) => {
    const { data } = await api.get('/reports/top-products', { params });
    return data.data.datos;
  },
  lowStock: async () => {
    const { data } = await api.get('/reports/low-stock');
    return data.data.datos;
  },
  salesByUser: async (params) => {
    const { data } = await api.get('/reports/sales-by-user', { params });
    return data.data.datos;
  },
};

import { api } from '../api/axios';

export const saleService = {
  list: async (params) => {
    const { data } = await api.get('/sales', { params });
    return { sales: data.data, pagination: data.pagination };
  },
  summary: async (params) => {
    const { data } = await api.get('/sales/summary', { params });
    return data.data.resumen;
  },
  getById: async (id) => {
    const { data } = await api.get(`/sales/${id}`);
    return data.data.venta;
  },
  create: async (payload) => {
    const { data } = await api.post('/sales', payload);
    return data.data.venta;
  },
  cancel: async (id) => {
    const { data } = await api.patch(`/sales/${id}/cancel`);
    return data.data.venta;
  },
};

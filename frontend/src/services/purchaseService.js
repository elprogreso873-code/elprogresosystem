import { api } from '../api/axios';

export const purchaseService = {
  list: async (params) => {
    const { data } = await api.get('/purchases', { params });
    return { purchases: data.data, pagination: data.pagination };
  },
  summary: async (params) => {
    const { data } = await api.get('/purchases/summary', { params });
    return data.data.resumen;
  },
  getById: async (id) => {
    const { data } = await api.get(`/purchases/${id}`);
    return data.data.compra;
  },
  create: async (payload) => {
    const { data } = await api.post('/purchases', payload);
    return data.data.compra;
  },
  cancel: async (id) => {
    const { data } = await api.patch(`/purchases/${id}/cancel`);
    return data.data.compra;
  },
};

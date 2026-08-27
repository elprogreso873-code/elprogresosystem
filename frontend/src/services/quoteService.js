import { api } from '../api/axios';

export const quoteService = {
  list: async (params) => {
    const { data } = await api.get('/quotes', { params });
    return { quotes: data.data, pagination: data.pagination };
  },
  getById: async (id) => {
    const { data } = await api.get(`/quotes/${id}`);
    return data.data.presupuesto;
  },
  getPrintData: async (id) => {
    const { data } = await api.get(`/quotes/${id}/print`);
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post('/quotes', payload);
    return data.data.presupuesto;
  },
  cancel: async (id) => {
    const { data } = await api.patch(`/quotes/${id}/cancel`);
    return data.data.presupuesto;
  },
};

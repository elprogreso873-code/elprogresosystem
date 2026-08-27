import { api } from '../api/axios';

export const paymentMethodService = {
  list: async (params = {}) => {
    const { data } = await api.get('/payment-methods', { params });
    return data.data;
  },
  getById: async (id) => {
    const { data } = await api.get(`/payment-methods/${id}`);
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post('/payment-methods', payload);
    return data.data;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/payment-methods/${id}`, payload);
    return data.data;
  },
  deactivate: async (id) => {
    const { data } = await api.patch(`/payment-methods/${id}/deactivate`);
    return data.data;
  },
};

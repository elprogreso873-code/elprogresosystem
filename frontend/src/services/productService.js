import { api } from '../api/axios';

export const productService = {
  quickSearch: async (q, limit = 12) => {
    const { data } = await api.get('/products/quick-search', {
      params: { q, limit },
    });
    return data.data.productos;
  },

  list: async (params) => {
    const { data } = await api.get('/products', { params });
    return { products: data.data, pagination: data.pagination };
  },

  getById: async (id) => {
    const { data } = await api.get(`/products/${id}`);
    return data.data.producto;
  },

  create: async (payload) => {
    const { data } = await api.post('/products', payload);
    return data.data.producto;
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/products/${id}`, payload);
    return data.data.producto;
  },

  deactivate: async (id) => {
    const { data } = await api.patch(`/products/${id}/deactivate`);
    return data.data.producto;
  },

  remove: async (id) => {
    const { data } = await api.delete(`/products/${id}`);
    return data.data;
  },
};

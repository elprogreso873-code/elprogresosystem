import { api } from '../api/axios';

export const categoryService = {
  list: async (params) => {
    const { data } = await api.get('/categories', { params });
    return { categories: data.data, pagination: data.pagination };
  },

  listActive: async () => {
    const { data } = await api.get('/categories/activas');
    return data.data.categorias;
  },

  getById: async (id) => {
    const { data } = await api.get(`/categories/${id}`);
    return data.data.categoria;
  },

  create: async (payload) => {
    const { data } = await api.post('/categories', payload);
    return data.data.categoria;
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/categories/${id}`, payload);
    return data.data.categoria;
  },

  deactivate: async (id) => {
    const { data } = await api.patch(`/categories/${id}/deactivate`);
    return data.data.categoria;
  },
};

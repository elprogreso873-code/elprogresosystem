import { api } from '../api/axios';

export const userService = {
  list: async (params) => {
    const { data } = await api.get('/users', { params });
    return { users: data.data, pagination: data.pagination };
  },

  getById: async (id) => {
    const { data } = await api.get(`/users/${id}`);
    return data.data.user;
  },

  create: async (payload) => {
    const { data } = await api.post('/users', payload);
    return data.data.user;
  },

  update: async (id, payload) => {
    const { data } = await api.put(`/users/${id}`, payload);
    return data.data.user;
  },

  deactivate: async (id) => {
    const { data } = await api.patch(`/users/${id}/deactivate`);
    return data.data.user;
  },

  getRoles: async () => {
    const { data } = await api.get('/users/roles');
    return data.data.roles;
  },
};

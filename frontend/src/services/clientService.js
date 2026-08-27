import { api } from '../api/axios';

export const clientService = {
  list: async (params) => {
    const { data } = await api.get('/clients', { params });
    return { clients: data.data, pagination: data.pagination };
  },
  listActive: async () => {
    const { data } = await api.get('/clients/activos');
    return data.data.clientes;
  },

  getById: async (id) => {
    const { data } = await api.get(`/clients/${id}`);
    return data.data.cliente;
  },
  search: async (search, limit = 25) => {
    const { data } = await api.get('/clients', {
      params: { search, limit, page: 1, estado: 'activo' },
    });
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post('/clients', payload);
    return data.data.cliente;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/clients/${id}`, payload);
    return data.data.cliente;
  },
  deactivate: async (id) => {
    const { data } = await api.patch(`/clients/${id}/deactivate`);
    return data.data.cliente;
  },
};

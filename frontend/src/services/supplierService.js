import { api } from '../api/axios';

export const supplierService = {
  list: async (params) => {
    const { data } = await api.get('/suppliers', { params });
    return { suppliers: data.data, pagination: data.pagination };
  },
  listActive: async () => {
    const { data } = await api.get('/suppliers/activos');
    return data.data.proveedores;
  },
  summary: async () => {
    const { data } = await api.get('/suppliers/summary');
    return data.data.resumen;
  },
  getById: async (id) => {
    const { data } = await api.get(`/suppliers/${id}`);
    return data.data;
  },
  search: async (search, limit = 25) => {
    const { data } = await api.get('/suppliers', {
      params: { search, limit, page: 1, estado: 'activo' },
    });
    return data.data;
  },
  create: async (payload) => {
    const { data } = await api.post('/suppliers', payload);
    return data.data.proveedor;
  },
  update: async (id, payload) => {
    const { data } = await api.put(`/suppliers/${id}`, payload);
    return data.data.proveedor;
  },
  deactivate: async (id) => {
    const { data } = await api.patch(`/suppliers/${id}/deactivate`);
    return data.data.proveedor;
  },
  movements: async (id, params) => {
    const { data } = await api.get(`/suppliers/${id}/movimientos`, { params });
    return { movements: data.data, pagination: data.pagination };
  },
  pay: async (id, payload) => {
    const { data } = await api.post(`/suppliers/${id}/pagos`, payload);
    return data.data;
  },
};

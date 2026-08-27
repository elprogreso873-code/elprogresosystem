import { api } from '../api/axios';

export const cashService = {
  summary: async () => {
    const { data } = await api.get('/cash/summary');
    return data.data.resumen;
  },
  current: async () => {
    const { data } = await api.get('/cash/current');
    return data.data.sesion;
  },
  currentDetail: async () => {
    const { data } = await api.get('/cash/current/detail');
    return data.data;
  },
  list: async (params) => {
    const { data } = await api.get('/cash', { params });
    return { sessions: data.data, pagination: data.pagination };
  },
  getById: async (id) => {
    const { data } = await api.get(`/cash/${id}`);
    return data.data.sesion;
  },
  getDetail: async (id) => {
    const { data } = await api.get(`/cash/${id}/detail`);
    return data.data;
  },
  movements: async (id, params) => {
    const { data } = await api.get(`/cash/${id}/movements`, { params });
    return { movements: data.data, pagination: data.pagination };
  },
  open: async (payload) => {
    const { data } = await api.post('/cash/open', payload);
    return data.data.sesion;
  },
  close: async (id, payload) => {
    const { data } = await api.patch(`/cash/${id}/close`, payload);
    return data.data.sesion;
  },
  addMovement: async (id, payload) => {
    const { data } = await api.post(`/cash/${id}/movements`, payload);
    return data.data.sesion;
  },
};

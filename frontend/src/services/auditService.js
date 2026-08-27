import { api } from '../api/axios';

export const auditService = {
  list: async (params) => {
    const { data } = await api.get('/audit', { params });
    return { logs: data.data, pagination: data.pagination };
  },
};

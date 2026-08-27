import { api } from '../api/axios';

export const inventoryService = {
  list: async (params) => {
    const { data } = await api.get('/inventory', { params });
    return { movements: data.data, pagination: data.pagination };
  },
  summary: async () => {
    const { data } = await api.get('/inventory/summary');
    return data.data.resumen;
  },
  createMovement: async (payload) => {
    const { data } = await api.post('/inventory/movements', payload);
    return data.data.movimiento;
  },
  stockAlerts: async (params) => {
    const { data } = await api.get('/inventory/stock-alerts', { params });
    return {
      productos: data.data,
      pagination: data.pagination,
      resumen: data.resumen,
    };
  },
};

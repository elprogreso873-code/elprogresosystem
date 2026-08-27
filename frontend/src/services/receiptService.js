import { api } from '../api/axios';

export const receiptService = {
  list: async (params) => {
    const { data } = await api.get('/receipts', { params });
    return { receipts: data.data, pagination: data.pagination };
  },
  getByVenta: async (ventaId) => {
    const { data } = await api.get(`/receipts/venta/${ventaId}`);
    return data.data;
  },
};

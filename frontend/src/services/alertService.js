import { api } from '../api/axios';

export const alertService = {
  list: async ({ umbral_horas } = {}) => {
    const params = {};
    if (umbral_horas != null) params.umbral_horas = umbral_horas;
    const { data } = await api.get('/alerts', { params });
    return data.data.alertas;
  },
};

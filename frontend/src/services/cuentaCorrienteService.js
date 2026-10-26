import { api } from '../api/axios';

export const cuentaCorrienteService = {
  async summary() {
    const { data } = await api.get('/cuenta-corriente/resumen');
    return data.data;
  },

  async list(params = {}) {
    const { data } = await api.get('/cuenta-corriente', { params });
    return { accounts: data.data, pagination: data.pagination };
  },

  async getClient(clienteId) {
    const { data } = await api.get(`/cuenta-corriente/cliente/${clienteId}`);
    return data.data;
  },

  async movements(clienteId, params = {}) {
    const { data } = await api.get(`/cuenta-corriente/cliente/${clienteId}/movimientos`, {
      params,
    });
    return { movements: data.data, pagination: data.pagination };
  },

  async getPeriodBalance(clienteId, { fecha_desde, fecha_hasta }) {
    const { data } = await api.get(`/cuenta-corriente/cliente/${clienteId}/saldo-periodo`, {
      params: { fecha_desde, fecha_hasta },
    });
    return data.data;
  },

  async registerPayment(clienteId, payload) {
    const { data } = await api.post(`/cuenta-corriente/cliente/${clienteId}/cobro`, payload);
    return data.data;
  },

  async registerAdjustment(clienteId, payload) {
    const { data } = await api.post(`/cuenta-corriente/cliente/${clienteId}/ajuste`, payload);
    return data.data;
  },
};

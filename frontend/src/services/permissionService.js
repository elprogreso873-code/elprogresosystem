import { api } from '../api/axios';

export const permissionService = {
  listAll: async () => {
    const { data } = await api.get('/permissions');
    return data.data.permisos;
  },

  listEmployees: async () => {
    const { data } = await api.get('/permissions/empleados');
    return data.data.empleados;
  },

  getByUser: async (userId) => {
    const { data } = await api.get(`/permissions/usuarios/${userId}`);
    return data.data;
  },

  assign: async (userId, permisoIds) => {
    const { data } = await api.put(`/permissions/usuarios/${userId}`, {
      permiso_ids: permisoIds,
    });
    return data.data;
  },
};

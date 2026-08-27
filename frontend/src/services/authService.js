import { api } from '../api/axios';

export const authService = {
  login: async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    return data.data;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data.data.user;
  },

  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    return data.data.user;
  },
};

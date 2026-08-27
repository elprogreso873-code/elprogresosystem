import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { env } from '../config/env.js';

export const api = axios.create({
  baseURL: env.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        useAuthStore.getState().logout();
        const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
        window.location.assign(`${window.location.origin}${base}/login`);
      }
    }
    return Promise.reject(error);
  }
);

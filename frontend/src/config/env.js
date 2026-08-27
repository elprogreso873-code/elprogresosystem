const appName = import.meta.env.VITE_APP_NAME || 'El Progreso';
const apiUrl = import.meta.env.VITE_API_URL || '/api/v1';
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

const normalizeApiUrl = (url) => url.replace(/\/+$/, '');

export const env = {
  appName,
  apiUrl: normalizeApiUrl(apiUrl),
  isProduction,
  isDevelopment,
};

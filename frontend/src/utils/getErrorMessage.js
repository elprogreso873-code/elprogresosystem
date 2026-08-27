const isNetworkError = (error) => {
  if (error.response) return false;
  const code = error.code || '';
  const message = error.message || '';
  return (
    code === 'ERR_NETWORK' ||
    code === 'ECONNABORTED' ||
    message === 'Network Error' ||
    message.toLowerCase().includes('network')
  );
};

export const getErrorMessage = (error) => {
  if (isNetworkError(error)) {
    return 'Sin conexión al servidor. Verificá tu internet antes de continuar.';
  }

  if (error.response?.status === 429) {    return 'Demasiadas solicitudes. Espere unos segundos e intente de nuevo.';
  }
  const data = error.response?.data;
  if (data?.errors?.length) {
    const detail = data.errors.map((e) => e.message).join('. ');
    return data.message && data.message !== 'Datos de entrada inválidos'
      ? `${data.message}: ${detail}`
      : detail;
  }
  if (data?.message) {
    return data.message;
  }
  return error.message || 'Ocurrió un error inesperado';
};

import { useState, useEffect, useCallback, useMemo } from 'react';
import { paymentMethodService } from '../services/paymentMethodService';
import { getErrorMessage } from '../utils/getErrorMessage';

/**
 * @param {{ activos?: boolean, estado?: string }} options
 */
export const usePaymentMethods = (options = {}) => {
  const { activos = true, estado } = options;
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (activos) params.activos = true;
      else if (estado) params.estado = estado;
      const data = await paymentMethodService.list(params);
      setMethods(data);
    } catch (err) {
      setError(getErrorMessage(err));
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, [activos, estado]);

  useEffect(() => {
    load();
  }, [load]);

  const defaultMethod = useMemo(
    () => methods.find((m) => m.es_predeterminado) || methods[0],
    [methods]
  );

  const labelMap = useMemo(
    () => Object.fromEntries(methods.map((m) => [m.codigo, m.nombre])),
    [methods]
  );

  const selectOptions = useMemo(
    () => methods.map((m) => ({ value: m.codigo, label: m.nombre })),
    [methods]
  );

  return {
    methods,
    loading,
    error,
    reload: load,
    defaultMethod,
    labelMap,
    selectOptions,
  };
};

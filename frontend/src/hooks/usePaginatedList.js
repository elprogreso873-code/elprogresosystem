import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getErrorMessage } from '../utils/getErrorMessage';
import { DEFAULT_PAGE_SIZE } from '../constants/pagination';

/**
 * Listado paginado del servidor con reinicio seguro de página al cambiar filtros.
 *
 * Evita el bug clásico: buscar en página 2+ y obtener resultados vacíos o incompletos
 * porque el fetch se dispara con la página vieja antes de resetear a 1.
 *
 * @param {Object} options
 * @param {(args: object) => Promise<{ data: any[], pagination: object }>} options.queryFn
 * @param {Record<string, unknown>} [options.params] — filtros/búsqueda (cambio → página 1)
 * @param {number} [options.defaultLimit]
 * @param {boolean} [options.enabled=true]
 */
export const usePaginatedList = ({
  queryFn,
  params = {},
  defaultLimit = DEFAULT_PAGE_SIZE,
  enabled = true,
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: defaultLimit,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const paramsKey = useMemo(() => JSON.stringify(params), [params]);
  const lastParamsKey = useRef(paramsKey);
  const queryFnRef = useRef(queryFn);
  const requestId = useRef(0);

  queryFnRef.current = queryFn;

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const setLimitAndReset = useCallback((newLimit) => {
    setLimit(newLimit);
    setPage(1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: 0,
        totalPages: 1,
      }));
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    const reqId = ++requestId.current;

    let pageToFetch = page;
    if (lastParamsKey.current !== paramsKey) {
      lastParamsKey.current = paramsKey;
      pageToFetch = 1;
      if (page !== 1) {
        setPage(1);
        return undefined;
      }
    }

    (async () => {
      setLoading(true);
      setError('');
      try {
        const result = await queryFnRef.current({
          page: pageToFetch,
          limit,
          ...params,
        });

        if (cancelled || reqId !== requestId.current) return;

        setItems(result.data ?? []);
        setPagination({
          page: result.pagination?.page ?? pageToFetch,
          limit: result.pagination?.limit ?? limit,
          total: result.pagination?.total ?? 0,
          totalPages: result.pagination?.totalPages ?? 1,
        });
      } catch (err) {
        if (!cancelled && reqId === requestId.current) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled && reqId === requestId.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, limit, paramsKey, enabled, refreshKey]);

  return {
    items,
    setItems,
    pagination,
    loading,
    error,
    setError,
    page,
    limit,
    setPage,
    setLimit: setLimitAndReset,
    refresh,
  };
};

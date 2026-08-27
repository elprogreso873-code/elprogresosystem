import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, ChevronRight } from 'lucide-react';
import { cuentaCorrienteService } from '../services/cuentaCorrienteService';
import { useDebounce } from '../hooks/useDebounce';
import { Card } from '../components/ui/Card';
import { SearchInput } from '../components/ui/SearchInput';
import { FilterToolbar } from '../components/common/FilterToolbar';
import { AccountSaldoRangeFilter } from '../components/commercial/AccountSaldoRangeFilter';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { getErrorMessage } from '../utils/getErrorMessage';

const chipBase =
  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all touch-manipulation border whitespace-nowrap';

const DEUDA_CHIPS = [
  { value: true, label: 'Con deuda' },
  { value: false, label: 'Todos los clientes' },
];

const AccountCard = ({ account: a, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen(a.id)}
    className="w-full text-left rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm hover:border-brand-300 hover:bg-brand-50/30 active:scale-[0.99] transition-all touch-manipulation"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-slate-800 truncate">{a.nombre}</p>
        {a.numero_documento && (
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            {a.tipo_documento} {a.numero_documento}
          </p>
        )}
      </div>
      <span
        className={`font-bold tabular-nums text-sm shrink-0 ${
          a.saldo_cuenta_corriente > 0 ? 'text-amber-700' : 'text-slate-500'
        }`}
      >
        {formatCurrency(a.saldo_cuenta_corriente)}
      </span>
    </div>
    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
      <span>
        Límite:{' '}
        {a.limite_credito != null ? formatCurrency(a.limite_credito) : 'Sin límite'}
      </span>
      <span>
        {a.ultimo_movimiento ? formatDate(a.ultimo_movimiento) : 'Sin movimientos'}
      </span>
    </div>
    <span className="inline-flex items-center justify-center gap-1 w-full py-2 rounded-xl text-sm font-medium text-brand-700 bg-brand-50">
      Ver cuenta
      <ChevronRight className="w-4 h-4" />
    </span>
  </button>
);

export const AccountCurrentPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [saldoRangeError, setSaldoRangeError] = useState('');
  const [search, setSearch] = useState('');
  const [soloDeuda, setSoloDeuda] = useState(true);
  const [saldoDesde, setSaldoDesde] = useState(0);
  const [saldoHasta, setSaldoHasta] = useState(0);
  const [boundsReady, setBoundsReady] = useState(false);
  const debouncedSearch = useDebounce(search);
  const debouncedSaldoDesde = useDebounce(saldoDesde, 350);
  const debouncedSaldoHasta = useDebounce(saldoHasta, 350);

  const bounds = useMemo(
    () =>
      summary != null
        ? { saldo_min: summary.saldo_min ?? 0, saldo_max: summary.saldo_max ?? 0 }
        : null,
    [summary]
  );

  const saldoFilterActive = useMemo(() => {
    if (!bounds) return false;
    return (
      debouncedSaldoDesde > bounds.saldo_min || debouncedSaldoHasta < bounds.saldo_max
    );
  }, [bounds, debouncedSaldoDesde, debouncedSaldoHasta]);

  const loadSummary = useCallback(() => {
    cuentaCorrienteService
      .summary()
      .then((data) => {
        setSummary(data);
        setSaldoDesde(data.saldo_min ?? 0);
        setSaldoHasta(data.saldo_max ?? 0);
        setBoundsReady(true);
      })
      .catch(() => {});
  }, []);

  const resetSaldoRange = useCallback(() => {
    if (!bounds) return;
    setSaldoDesde(bounds.saldo_min);
    setSaldoHasta(bounds.saldo_max);
    setSaldoRangeError('');
  }, [bounds]);

  const saldoRangeValid = debouncedSaldoDesde <= debouncedSaldoHasta;

  const listParams = useMemo(() => {
    const params = {
      search: debouncedSearch,
      solo_deuda: soloDeuda,
    };
    if (saldoFilterActive) {
      params.saldo_min = debouncedSaldoDesde;
      params.saldo_max = debouncedSaldoHasta;
    }
    return params;
  }, [
    debouncedSearch,
    soloDeuda,
    debouncedSaldoDesde,
    debouncedSaldoHasta,
    saldoFilterActive,
  ]);

  const {
    items: accounts,
    pagination,
    loading,
    error: listError,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { accounts: data, pagination: pag } = await cuentaCorrienteService.list({
        page,
        limit,
        ...params,
      });
      return { data, pagination: pag };
    },
    params: listParams,
    enabled: boundsReady && saldoRangeValid,
  });

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (!saldoRangeValid) {
      setSaldoRangeError('El saldo mínimo no puede ser mayor al máximo');
    } else {
      setSaldoRangeError('');
    }
  }, [saldoRangeValid]);

  const openAccount = (id) => navigate(`/clientes/cuenta-corriente/${id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-brand-600" />
            Cuenta corriente
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Saldos, cobros y movimientos de clientes
          </p>
        </div>
        {!loading && pagination.total > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <Users className="w-4 h-4 text-brand-600 shrink-0" />
            <span>
              <strong className="text-slate-800 tabular-nums">{pagination.total}</strong> cliente
              {pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="!p-5 border-l-4 border-l-amber-500">
            <p className="text-sm text-slate-500">Total por cobrar</p>
            <p className="text-2xl font-bold text-amber-800 mt-1 tabular-nums">
              {formatCurrency(summary.total_por_cobrar)}
            </p>
          </Card>
          <Card className="!p-5">
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Users className="w-4 h-4" /> Con deuda
            </p>
            <p className="text-2xl font-bold mt-1">{summary.clientes_con_deuda}</p>
          </Card>
          <Card className="!p-5">
            <p className="text-sm text-slate-500">Movimientos hoy</p>
            <p className="text-2xl font-bold mt-1">{summary.movimientos_hoy}</p>
          </Card>
        </div>
      )}

      {(error || listError) && <Alert>{error || listError}</Alert>}

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 sm:p-6 space-y-3 border-b border-slate-100">
          <AccountSaldoRangeFilter
            bounds={bounds}
            saldoDesde={saldoDesde}
            saldoHasta={saldoHasta}
            onDesdeChange={setSaldoDesde}
            onHastaChange={setSaldoHasta}
            onReset={resetSaldoRange}
            disabled={loading || !boundsReady}
            error={saldoRangeError}
          />

          <FilterToolbar
            onRefresh={refresh}
            search={
              <SearchInput
                id="buscar-cc"
                label="Buscar cliente"
                placeholder="Nombre o documento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            }
            filters={[
              <div key="deuda" className="flex flex-col gap-1.5 w-full min-w-[200px]">
                <span className="text-sm font-medium text-slate-700">Mostrar</span>
                <div className="flex flex-wrap gap-1.5">
                  {DEUDA_CHIPS.map((chip) => (
                    <button
                      key={String(chip.value)}
                      type="button"
                      onClick={() => setSoloDeuda(chip.value)}
                      className={`${chipBase} ${
                        soloDeuda === chip.value
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>,
            ]}
          />
        </div>

        <div className="px-4 sm:px-6 pb-6 pt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : accounts.length === 0 ? (
            <EmptyState
              title="Sin registros"
              description={
                soloDeuda
                  ? 'No hay clientes con deuda para los filtros seleccionados'
                  : 'No se encontraron clientes activos con esos criterios'
              }
            />
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {accounts.map((a) => (
                  <AccountCard key={a.id} account={a} onOpen={openAccount} />
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 font-medium text-right">Saldo</th>
                      <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">
                        Límite
                      </th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">
                        Último mov.
                      </th>
                      <th className="px-4 py-3 w-10" aria-hidden="true" />
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => openAccount(a.id)}
                        onKeyDown={(e) => e.key === 'Enter' && openAccount(a.id)}
                        tabIndex={0}
                        role="link"
                        className="border-b border-slate-100 hover:bg-brand-50/40 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{a.nombre}</p>
                          {a.numero_documento && (
                            <p className="text-xs text-slate-500 font-mono">
                              {a.tipo_documento} {a.numero_documento}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-bold tabular-nums ${
                              a.saldo_cuenta_corriente > 0
                                ? 'text-amber-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {formatCurrency(a.saldo_cuenta_corriente)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 hidden sm:table-cell tabular-nums">
                          {a.limite_credito != null
                            ? formatCurrency(a.limite_credito)
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">
                          {a.ultimo_movimiento
                            ? formatDate(a.ultimo_movimiento)
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400">
                          <ChevronRight className="w-4 h-4 inline-block" aria-hidden="true" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                onLimitChange={setLimit}
                itemLabel="cuentas"
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

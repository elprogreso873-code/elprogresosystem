import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Eye, Ban } from 'lucide-react';
import { quoteService } from '../services/quoteService';
import { useDebounce } from '../hooks/useDebounce';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { FilterToolbar } from '../components/common/FilterToolbar';
import { SalesPeriodFilter } from '../components/commercial/SalesPeriodFilter';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { getErrorMessage } from '../utils/getErrorMessage';
import { OnlineOnlyLink } from '../components/common/OnlineOnlyLink';
import {
  getDefaultSalesDateRange,
  getPresetRange,
  isValidDateRange,
} from '../utils/dateRange';

export const QuotesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.PRESUPUESTOS_CREAR);
  const canCancel = hasPermission(PERMISSIONS.PRESUPUESTOS_ANULAR);

  const defaultRange = getDefaultSalesDateRange();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [fechaDesde, setFechaDesde] = useState(defaultRange.fecha_desde);
  const [fechaHasta, setFechaHasta] = useState(defaultRange.fecha_hasta);
  const [cancellingId, setCancellingId] = useState(null);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(t);
  }, [success]);

  const dateRangeValid = isValidDateRange(fechaDesde, fechaHasta);

  const listParams = useMemo(
    () => ({
      search: debouncedSearch,
      estado: estadoFilter,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
    }),
    [debouncedSearch, estadoFilter, fechaDesde, fechaHasta]
  );

  const {
    items: quotes,
    pagination,
    loading,
    error: listError,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { quotes: data, pagination: pag } = await quoteService.list({ page, limit, ...params });
      return { data, pagination: pag };
    },
    params: listParams,
    enabled: dateRangeValid,
  });

  const handlePresetSelect = (presetId) => {
    if (presetId === 'custom') return;
    const range = getPresetRange(presetId);
    setFechaDesde(range.fecha_desde);
    setFechaHasta(range.fecha_hasta);
  };

  const estadoLabel = {
    vigente: 'Vigente',
    anulado: 'Anulado',
    convertido: 'Convertido',
  };

  const estadoVariant = (estado) => {
    if (estado === 'vigente') return 'activo';
    if (estado === 'convertido') return 'admin';
    return 'inactivo';
  };

  const handleCancel = async (quote) => {
    if (!window.confirm(`¿Anular el presupuesto ${quote.numero}?`)) return;
    setCancellingId(quote.id);
    setError('');
    try {
      await quoteService.cancel(quote.id);
      setSuccess(`Presupuesto ${quote.numero} anulado correctamente`);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-brand-600" />
            Presupuestos
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Cotizaciones sin impacto en stock ni caja</p>
        </div>
        {canCreate && (
          <OnlineOnlyLink to="/presupuestos/nuevo">
            <Plus className="w-4 h-4" /> Nuevo presupuesto
          </OnlineOnlyLink>
        )}
      </div>

      {!dateRangeValid && <Alert>El rango de fechas no es válido</Alert>}
      {(error || listError) && <Alert>{error || listError}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <SalesPeriodFilter
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        onDesdeChange={setFechaDesde}
        onHastaChange={setFechaHasta}
        onPresetSelect={handlePresetSelect}
        soloTurnoActual={false}
        onTurnoToggle={() => {}}
        cashSession={null}
        loading={loading}
      />

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 sm:p-6 pb-0">
          <FilterToolbar
            className="mb-6"
            onRefresh={refresh}
            search={
              <SearchInput
                id="buscar-presupuestos"
                label="Buscar presupuesto"
                placeholder="Nº presupuesto o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            }
            filters={[
              <Select
                key="e"
                id="estado-p"
                label="Estado"
                size="lg"
                hidePlaceholder
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                options={[
                  { value: 'todos', label: 'Todos' },
                  { value: 'vigente', label: 'Vigentes' },
                  { value: 'convertido', label: 'Convertidos' },
                  { value: 'anulado', label: 'Anulados' },
                ]}
              />,
            ]}
          />
        </div>
        <div className="px-4 sm:px-6 pb-6">
          {loading ? (
            <Spinner />
          ) : quotes.length === 0 ? (
            <EmptyState
              title="Sin presupuestos"
              description={
                canCreate
                  ? 'Cree su primer presupuesto o amplíe el período'
                  : 'No hay presupuestos en el período seleccionado'
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-4 py-3 text-left font-medium">Nº Presupuesto</th>
                      <th className="px-4 py-3 text-left font-medium">Cliente</th>
                      <th className="px-4 py-3 text-left font-medium">Total</th>
                      <th className="px-4 py-3 text-left font-medium">Estado</th>
                      <th className="px-4 py-3 text-left font-medium hidden md:table-cell">
                        Válido hasta
                      </th>
                      <th className="px-4 py-3 text-left font-medium hidden md:table-cell">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotes.map((q) => (
                      <tr key={q.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono font-medium text-slate-800">
                          {q.numero}
                        </td>
                        <td className="px-4 py-3">{q.cliente_nombre || 'Consumidor final'}</td>
                        <td className="px-4 py-3 font-semibold tabular-nums">
                          {formatCurrency(q.total)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={estadoVariant(q.estado)}>
                            {estadoLabel[q.estado] || q.estado}
                          </Badge>
                          {q.estado === 'convertido' && q.venta_id && (
                            <Link
                              to={`/ventas/${q.venta_id}`}
                              className="block text-xs text-brand-700 hover:underline mt-1"
                            >
                              {q.venta_numero || `Venta #${q.venta_id}`}
                            </Link>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                          {q.validez_hasta ? formatDate(q.validez_hasta) : '—'}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                          {formatDate(q.fecha_presupuesto)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => navigate(`/presupuestos/${q.id}`)}
                              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                              title="Ver detalle"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canCancel && q.puede_anular && (
                              <button
                                type="button"
                                onClick={() => handleCancel(q)}
                                disabled={cancellingId === q.id}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                                title="Anular presupuesto"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                className="mt-6"
                page={pagination.page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={pagination.limit}
                onPageChange={setPage}
                onLimitChange={setLimit}
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

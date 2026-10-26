import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Eye, Ban } from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { useDebounce } from '../hooks/useDebounce';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { FilterToolbar } from '../components/common/FilterToolbar';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { getErrorMessage } from '../utils/getErrorMessage';
import { OnlineOnlyLink } from '../components/common/OnlineOnlyLink';
import { DateRangeFilter } from '../components/common/DateRangeFilter';
import { getDefaultSalesDateRange, getPresetRange, isValidDateRange } from '../utils/dateRange';

const pagoVariant = {
  pagada: 'activo',
  parcial: 'admin',
  pendiente: 'empleado',
};

const pagoLabel = {
  pagada: 'Pagada',
  parcial: 'Parcial',
  pendiente: 'Pendiente',
};

export const PurchasesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.COMPRAS_CREAR);
  const canCancel = hasPermission(PERMISSIONS.COMPRAS_ANULAR);
  const defaultRange = getDefaultSalesDateRange();

  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [pagoFilter, setPagoFilter] = useState('todos');
  const [fechaDesde, setFechaDesde] = useState(defaultRange.fecha_desde);
  const [fechaHasta, setFechaHasta] = useState(defaultRange.fecha_hasta);
  const [cancellingId, setCancellingId] = useState(null);
  const debouncedSearch = useDebounce(search);
  const dateRangeValid = isValidDateRange(fechaDesde, fechaHasta);

  const listParams = useMemo(
    () => ({
      search: debouncedSearch,
      estado: estadoFilter,
      estado_pago: pagoFilter,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
    }),
    [debouncedSearch, estadoFilter, pagoFilter, fechaDesde, fechaHasta]
  );

  const {
    items: purchases,
    pagination,
    loading,
    error: listError,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { purchases: data, pagination: pag } = await purchaseService.list({
        page,
        limit,
        ...params,
      });
      return { data, pagination: pag };
    },
    params: listParams,
    enabled: dateRangeValid,
  });

  useEffect(() => {
    if (!dateRangeValid) return;
    purchaseService.summary({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta }).then(setSummary).catch(() => {});
  }, [fechaDesde, fechaHasta, dateRangeValid, purchases]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(t);
  }, [success]);

  const handleCancel = async (compra) => {
    if (!window.confirm(`¿Anular ${compra.numero}? Se revierte el stock y el saldo.`)) return;
    setCancellingId(compra.id);
    try {
      await purchaseService.cancel(compra.id);
      setSuccess('Compra anulada');
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-brand-600" />
            Compras
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Compras a proveedores y stock de entrada</p>
        </div>
        {canCreate && (
          <OnlineOnlyLink to="/compras/nueva" buttonSize="lg">
            <Plus className="w-5 h-5" />
            Nueva compra
          </OnlineOnlyLink>
        )}
      </header>

      {error && <Alert className="mb-4">{error}</Alert>}
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}
      {listError && <Alert className="mb-4">{listError}</Alert>}

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <Card className="!p-4">
            <p className="text-xs text-slate-500">Compras</p>
            <p className="text-xl font-bold tabular-nums">{summary.cantidad}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-xl font-bold tabular-nums">{formatCurrency(summary.total)}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-slate-500">Pagado</p>
            <p className="text-xl font-bold text-emerald-700 tabular-nums">{formatCurrency(summary.pagado)}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-slate-500">Saldo a proveedores</p>
            <p className="text-xl font-bold text-amber-700 tabular-nums">{formatCurrency(summary.saldo)}</p>
          </Card>
        </div>
      )}

      <Card>
        <FilterToolbar
          className="mb-4"
          onRefresh={refresh}
          search={
            <SearchInput
              id="buscar-compras"
              label="Buscar"
              placeholder="Número o proveedor"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          }
          filters={[
            <Select
              key="e"
              id="filtro-estado-compra"
              label="Estado"
              size="lg"
              hidePlaceholder
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              options={[
                { value: 'todos', label: 'Todos los estados' },
                { value: 'completada', label: 'Completadas' },
                { value: 'anulada', label: 'Anuladas' },
              ]}
            />,
            <Select
              key="p"
              id="filtro-pago-compra"
              label="Pago"
              size="lg"
              hidePlaceholder
              value={pagoFilter}
              onChange={(e) => setPagoFilter(e.target.value)}
              options={[
                { value: 'todos', label: 'Todo pago' },
                { value: 'pendiente', label: 'Pendientes' },
                { value: 'parcial', label: 'Parciales' },
                { value: 'pagada', label: 'Pagadas' },
              ]}
            />,
          ]}
        />
        <div className="mb-6">
          <DateRangeFilter
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onDesdeChange={setFechaDesde}
            onHastaChange={setFechaHasta}
            onPresetSelect={(presetId) => {
              if (presetId === 'custom') return;
              const range = getPresetRange(presetId);
              setFechaDesde(range.fecha_desde);
              setFechaHasta(range.fecha_hasta);
            }}
            showApplyButton={false}
          />
        </div>

        {loading ? (
          <Spinner />
        ) : purchases.length === 0 ? (
          <EmptyState title="Sin compras" description="Registre la primera compra a un proveedor" />
        ) : (
          <>
            <div className="space-y-3">
              {purchases.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-800">{c.numero}</p>
                      <Badge variant={c.estado === 'anulada' ? 'inactivo' : 'activo'}>{c.estado}</Badge>
                      {c.estado !== 'anulada' && (
                        <Badge variant={pagoVariant[c.estado_pago]}>{pagoLabel[c.estado_pago]}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{c.proveedor_nombre}</p>
                    <p className="text-xs text-slate-500">{formatDate(c.fecha_compra)} · {c.usuario_nombre}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold tabular-nums">{formatCurrency(c.total)}</p>
                    {c.saldo > 0 && c.estado === 'completada' && (
                      <p className="text-xs text-amber-700">Saldo {formatCurrency(c.saldo)}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/compras/${c.id}`)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {canCancel && c.puede_anular && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={cancellingId === c.id}
                        onClick={() => handleCancel(c)}
                      >
                        <Ban className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Pagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              onLimitChange={setLimit}
              itemLabel="compras"
            />
          </>
        )}
      </Card>
    </div>
  );
};

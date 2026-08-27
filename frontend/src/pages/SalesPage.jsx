import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Eye, Ban } from 'lucide-react';
import { saleService } from '../services/saleService';
import { cashService } from '../services/cashService';
import { useDebounce } from '../hooks/useDebounce';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { FilterToolbar } from '../components/common/FilterToolbar';
import { SalesPeriodFilter } from '../components/commercial/SalesPeriodFilter';
import { SaleCancelModal } from '../components/commercial/SaleCancelModal';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { getErrorMessage } from '../utils/getErrorMessage';
import { OnlineOnlyLink } from '../components/common/OnlineOnlyLink';
import { useConnection } from '../context/ConnectionContext';
import {
  getDefaultSalesDateRange,
  getPresetRange,
  isValidDateRange,
} from '../utils/dateRange';
import { buildSaleRedoState } from '../utils/saleRedo';

export const SalesPage = () => {
  const navigate = useNavigate();
  const { isOffline } = useConnection();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.VENTAS_CREAR);
  const canCancel = hasPermission(PERMISSIONS.VENTAS_ANULAR);

  const defaultRange = getDefaultSalesDateRange();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [fechaDesde, setFechaDesde] = useState(defaultRange.fecha_desde);
  const [fechaHasta, setFechaHasta] = useState(defaultRange.fecha_hasta);
  const [soloTurnoActual, setSoloTurnoActual] = useState(false);
  const [cashSession, setCashSession] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    cashService.current().then(setCashSession).catch(() => setCashSession(null));
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(t);
  }, [success]);

  const dateRangeValid = isValidDateRange(fechaDesde, fechaHasta);
  const listEnabled = soloTurnoActual ? Boolean(cashSession?.id) : dateRangeValid;

  const listParams = useMemo(() => {
    const base = { search: debouncedSearch, estado: estadoFilter };
    if (soloTurnoActual && cashSession?.id) {
      return { ...base, caja_sesion_id: cashSession.id };
    }
    return { ...base, fecha_desde: fechaDesde, fecha_hasta: fechaHasta };
  }, [
    debouncedSearch,
    estadoFilter,
    fechaDesde,
    fechaHasta,
    soloTurnoActual,
    cashSession?.id,
  ]);

  const {
    items: sales,
    pagination,
    loading,
    error: listError,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { sales: data, pagination: pag } = await saleService.list({ page, limit, ...params });
      return { data, pagination: pag };
    },
    params: listParams,
    enabled: listEnabled,
  });

  useEffect(() => {
    if (!listEnabled) {
      setSummary({
        total_ventas: 0,
        ingresos: 0,
        ventas_completadas: 0,
        ventas_anuladas: 0,
      });
      return;
    }
    const summaryParams =
      soloTurnoActual && cashSession?.id
        ? { caja_sesion_id: cashSession.id }
        : { fecha_desde: fechaDesde, fecha_hasta: fechaHasta };
    saleService.summary(summaryParams).then(setSummary).catch(() => {});
  }, [listEnabled, soloTurnoActual, cashSession?.id, fechaDesde, fechaHasta]);

  const handlePresetSelect = (presetId) => {
    if (presetId === 'custom') return;
    const range = getPresetRange(presetId);
    setSoloTurnoActual(false);
    setFechaDesde(range.fecha_desde);
    setFechaHasta(range.fecha_hasta);
  };

  const handleCancelOnly = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setError('');
    try {
      await saleService.cancel(cancelTarget.id);
      setSuccess(`Venta ${cancelTarget.numero} anulada correctamente`);
      setCancelTarget(null);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelAndRedo = async () => {
    if (!cancelTarget) return;
    if (isOffline) {
      setError('Sin conexión — no podés registrar una nueva venta hasta recuperar internet.');
      return;
    }
    setCancelling(true);
    setError('');
    try {
      const venta = await saleService.getById(cancelTarget.id);
      await saleService.cancel(cancelTarget.id);
      setCancelTarget(null);
      const redoState = buildSaleRedoState(venta);
      navigate('/ventas/nueva', {
        state: {
          ...redoState,
          message: `Venta ${venta.numero} anulada. Revise el carrito y registre la nueva venta.`,
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-brand-600" />
            Ventas
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Registro y consulta de ventas</p>
        </div>
        {canCreate && (
          <OnlineOnlyLink to="/ventas/nueva">
            <Plus className="w-4 h-4" /> Nueva venta
          </OnlineOnlyLink>
        )}
      </div>

      {!soloTurnoActual && !dateRangeValid && (
        <Alert>El rango de fechas no es válido</Alert>
      )}
      {(error || listError) && <Alert>{error || listError}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <SalesPeriodFilter
        fechaDesde={fechaDesde}
        fechaHasta={fechaHasta}
        onDesdeChange={(v) => {
          setSoloTurnoActual(false);
          setFechaDesde(v);
        }}
        onHastaChange={(v) => {
          setSoloTurnoActual(false);
          setFechaHasta(v);
        }}
        onPresetSelect={handlePresetSelect}
        soloTurnoActual={soloTurnoActual}
        onTurnoToggle={() => setSoloTurnoActual((v) => !v)}
        cashSession={cashSession}
        loading={loading}
      />

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="!p-5">
            <p className="text-sm text-slate-500">Ventas en el período</p>
            <p className="text-2xl font-bold mt-1">{summary.total_ventas}</p>
            {summary.ventas_anuladas > 0 && (
              <p className="text-xs text-slate-500 mt-1">
                {summary.ventas_completadas} completadas · {summary.ventas_anuladas} anuladas
              </p>
            )}
          </Card>
          <Card className="!p-5 border-l-4 border-l-brand-500">
            <p className="text-sm text-slate-500">Ingresos (completadas)</p>
            <p className="text-2xl font-bold text-brand-700 mt-1">
              {formatCurrency(summary.ingresos)}
            </p>
          </Card>
          <Card className="!p-5 border-l-4 border-l-emerald-500">
            <p className="text-sm text-slate-500">Filtro activo</p>
            <p className="text-base font-semibold mt-1 text-slate-800">
              {soloTurnoActual ? 'Turno de caja actual' : 'Rango de fechas'}
            </p>
          </Card>
        </div>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 sm:p-6 pb-0">
          <FilterToolbar
            className="mb-6"
            onRefresh={refresh}
            search={
              <SearchInput
                id="buscar-ventas"
                label="Buscar venta"
                placeholder="Nº venta o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            }
            filters={[
              <Select
                key="e"
                id="estado-v"
                label="Estado"
                size="lg"
                hidePlaceholder
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                options={[
                  { value: 'todos', label: 'Todas' },
                  { value: 'completada', label: 'Completadas' },
                  { value: 'anulada', label: 'Anuladas' },
                ]}
              />,
            ]}
          />
        </div>
        <div className="px-4 sm:px-6 pb-6">
          {loading ? (
            <Spinner />
          ) : sales.length === 0 ? (
            <EmptyState
              title="Sin ventas"
              description={
                soloTurnoActual && !cashSession
                  ? 'Abra la caja para registrar ventas en este turno'
                  : canCreate
                    ? 'Registre su primera venta o amplíe el período'
                    : 'No hay ventas en el período seleccionado'
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-4 py-3 text-left font-medium">Nº Venta</th>
                      <th className="px-4 py-3 text-left font-medium">Cliente</th>
                      <th className="px-4 py-3 text-left font-medium">Total</th>
                      <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Pago</th>
                      <th className="px-4 py-3 text-left font-medium">Estado</th>
                      <th className="px-4 py-3 text-left font-medium hidden md:table-cell">
                        Fecha
                      </th>
                      <th className="px-4 py-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-mono text-sm font-medium text-slate-800">
                          {s.numero}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {s.cliente_nombre || 'Consumidor final'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {formatCurrency(s.total)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 hidden sm:table-cell max-w-[140px] truncate">
                          {s.metodo_pago_nombre || s.metodo_pago || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={s.estado === 'completada' ? 'activo' : 'inactivo'}>
                            {s.estado}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                          {formatDate(s.fecha_venta)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Link to={`/ventas/${s.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            {canCancel && s.estado === 'completada' && s.puede_anular && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!text-red-600"
                                onClick={() => setCancelTarget(s)}
                                title="Anular venta"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                            {canCancel && s.estado === 'completada' && !s.puede_anular && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!text-slate-300 cursor-not-allowed"
                                disabled
                                title={
                                  s.caja_sesion_estado === 'cerrada'
                                    ? 'Turno de caja cerrado'
                                    : 'Solo puede anular ventas del turno actual'
                                }
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
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
                itemLabel="ventas"
              />
            </>
          )}
        </div>
      </Card>

      <SaleCancelModal
        isOpen={Boolean(cancelTarget)}
        onClose={() => !cancelling && setCancelTarget(null)}
        sale={cancelTarget}
        onCancelOnly={handleCancelOnly}
        onCancelAndRedo={handleCancelAndRedo}
        loading={cancelling}
      />
    </div>
  );
};

import { useState, useEffect, useMemo } from 'react';
import {
  Warehouse,
  Plus,
  ArrowDown,
  ArrowUp,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { ProductPicker } from '../components/catalog/ProductPicker';
import { InventoryPeriodFilter } from '../components/inventory/InventoryPeriodFilter';
import { InventoryMovementForm } from '../components/forms/InventoryMovementForm';
import { formatDate } from '../utils/formatDate';
import { formatNumber, formatCurrency } from '../utils/formatCurrency';
import { getErrorMessage } from '../utils/getErrorMessage';
import {
  getDefaultInventoryDateRange,
  getPresetRange,
  isValidDateRange,
} from '../utils/dateRange';

const tipoBadge = {
  entrada: 'bg-emerald-100 text-emerald-800',
  salida: 'bg-red-100 text-red-800',
  ajuste: 'bg-blue-100 text-blue-800',
};

const tipoIcon = {
  entrada: ArrowDown,
  salida: ArrowUp,
  ajuste: SlidersHorizontal,
};

const TIPO_CHIPS = [
  { value: 'todos', label: 'Todos' },
  { value: 'entrada', label: 'Entradas' },
  { value: 'salida', label: 'Salidas' },
  { value: 'ajuste', label: 'Ajustes' },
];

const chipBase =
  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all touch-manipulation border whitespace-nowrap';

const MovementTipoBadge = ({ tipo }) => {
  const Icon = tipoIcon[tipo] || SlidersHorizontal;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${tipoBadge[tipo]}`}
    >
      <Icon className="w-3 h-3" />
      {tipo}
    </span>
  );
};

const MovementCard = ({ movement: m }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold text-slate-800 truncate">{m.producto_nombre}</p>
        <p className="text-xs text-slate-500 font-mono mt-0.5">{m.producto_codigo}</p>
      </div>
      <MovementTipoBadge tipo={m.tipo} />
    </div>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-400">Cantidad</p>
        <p className="font-medium text-slate-800 tabular-nums">{formatNumber(m.cantidad, 2)}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-400">Stock</p>
        <p className="text-slate-700 tabular-nums">
          {formatNumber(m.stock_anterior, 0)} →{' '}
          <span className="font-semibold text-slate-800">{formatNumber(m.stock_posterior, 0)}</span>
        </p>
      </div>
    </div>
    {m.motivo && (
      <p className="text-sm text-slate-600 line-clamp-2">
        <span className="text-slate-400 text-xs uppercase">Motivo: </span>
        {m.motivo}
      </p>
    )}
    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
      <span>{formatDate(m.fecha)}</span>
      <span>{m.usuario_nombre || '—'}</span>
    </div>
  </div>
);

export const InventoryPage = () => {
  const { hasPermission } = usePermissions();
  const canMove = hasPermission(PERMISSIONS.INVENTARIO_MOVIMIENTO);

  const defaultRange = getDefaultInventoryDateRange();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [productoFilter, setProductoFilter] = useState('');
  const [filterProduct, setFilterProduct] = useState(null);
  const [fechaDesde, setFechaDesde] = useState(defaultRange.fecha_desde);
  const [fechaHasta, setFechaHasta] = useState(defaultRange.fecha_hasta);
  const [modalOpen, setModalOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    inventoryService.summary().then(setSummary).catch(() => {});
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(t);
  }, [success]);

  const dateRangeValid = isValidDateRange(fechaDesde, fechaHasta);

  const listParams = useMemo(() => {
    const params = {
      tipo: tipoFilter,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
    };
    if (productoFilter) params.producto_id = productoFilter;
    return params;
  }, [tipoFilter, productoFilter, fechaDesde, fechaHasta]);

  const {
    items: movements,
    pagination,
    loading,
    error: listError,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { movements: data, pagination: pag } = await inventoryService.list({
        page,
        limit,
        ...params,
      });
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

  const closeModal = () => setModalOpen(false);

  const handleMovement = async (data) => {
    setFormLoading(true);
    setError('');
    try {
      await inventoryService.createMovement(data);
      setSuccess('Movimiento registrado correctamente');
      closeModal();
      refresh();
      inventoryService.summary().then(setSummary);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Warehouse className="w-7 h-7 text-brand-600" />
            Inventario
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Movimientos y trazabilidad de stock</p>
        </div>
        {canMove && (
          <Button
            onClick={() => {
              setFormKey((k) => k + 1);
              setModalOpen(true);
            }}
            className="min-h-11 touch-manipulation"
          >
            <Plus className="w-4 h-4" /> Nuevo movimiento
          </Button>
        )}
      </div>

      {!dateRangeValid && <Alert>El rango de fechas no es válido</Alert>}
      {(error || listError) && <Alert>{error || listError}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="!p-5 border-l-4 border-l-brand-500">
            <p className="text-sm text-slate-500">Productos activos</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{summary.total_productos}</p>
          </Card>
          <Card className="!p-5 border-l-4 border-l-red-400">
            <p className="text-sm text-slate-500">Stock bajo</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{summary.stock_bajo}</p>
          </Card>
          <Card className="!p-5">
            <p className="text-sm text-slate-500">Valor inventario (aprox.)</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {formatCurrency(summary.valor_inventario)}
            </p>
          </Card>
        </div>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 sm:p-6 space-y-4 border-b border-slate-100">
          <InventoryPeriodFilter
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onDesdeChange={setFechaDesde}
            onHastaChange={setFechaHasta}
            onPresetSelect={handlePresetSelect}
            loading={loading}
          />

          <div className="flex flex-col lg:flex-row lg:items-end gap-3">
            <div className="flex-1 min-w-0 lg:max-w-md">
              <ProductPicker
                id="filtro-prod-inv"
                label="Producto"
                size="md"
                allowAll
                allLabel="Todos los productos"
                value={productoFilter}
                selectedProduct={filterProduct}
                onChange={(v) => {
                  setProductoFilter(v);
                  if (!v) setFilterProduct(null);
                }}
                onProductSelect={setFilterProduct}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Tipo</span>
              <div className="flex flex-wrap gap-1.5">
                {TIPO_CHIPS.map((chip) => (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setTipoFilter(chip.value)}
                    className={`${chipBase} ${
                      tipoFilter === chip.value
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              onClick={refresh}
              disabled={loading}
              className="h-11 shrink-0"
              aria-label="Actualizar listado"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-6 pt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : movements.length === 0 ? (
            <EmptyState
              title="Sin movimientos"
              description="No hay registros para el período y filtros seleccionados"
            />
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {movements.map((m) => (
                  <MovementCard key={m.id} movement={m} />
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-4 py-3 text-left font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium">Producto</th>
                      <th className="px-4 py-3 text-left font-medium">Tipo</th>
                      <th className="px-4 py-3 text-left font-medium">Cantidad</th>
                      <th className="px-4 py-3 text-left font-medium">Stock</th>
                      <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Motivo</th>
                      <th className="px-4 py-3 text-left font-medium hidden xl:table-cell">Usuario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatDate(m.fecha)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{m.producto_nombre}</p>
                          <p className="text-xs text-slate-400">{m.producto_codigo}</p>
                        </td>
                        <td className="px-4 py-3">
                          <MovementTipoBadge tipo={m.tipo} />
                        </td>
                        <td className="px-4 py-3 font-medium tabular-nums">
                          {formatNumber(m.cantidad, 2)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 tabular-nums">
                          {formatNumber(m.stock_anterior, 0)} →{' '}
                          <span className="font-medium text-slate-800">
                            {formatNumber(m.stock_posterior, 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden lg:table-cell max-w-[200px] truncate">
                          {m.motivo}
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden xl:table-cell">
                          {m.usuario_nombre || '—'}
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
                itemLabel="movimientos"
              />
            </>
          )}
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Registrar movimiento"
        size="lg"
        stickyFooter
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeModal} disabled={formLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="inventory-movement-form"
              isLoading={formLoading}
              disabled={formLoading}
            >
              Registrar movimiento
            </Button>
          </>
        }
      >
        <InventoryMovementForm
          key={formKey}
          formId="inventory-movement-form"
          onSubmit={handleMovement}
        />
      </Modal>
    </div>
  );
};

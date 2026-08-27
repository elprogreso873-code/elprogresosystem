import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, Pencil } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import { useDebounce } from '../hooks/useDebounce';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { FilterToolbar } from '../components/common/FilterToolbar';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { ProductImage } from '../components/catalog/ProductImage';
import { ProductMetaChips } from '../components/catalog/ProductMetaChips';
import { ProductForm } from '../components/forms/ProductForm';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';
import { getErrorMessage } from '../utils/getErrorMessage';
import {
  STOCK_ALERT_FILTERS,
  STOCK_ALERT_TYPE_LABELS,
  STOCK_ALERT_TYPE_STYLES,
} from '../utils/stockAlertLabels';

const chipBase =
  'px-3 py-1.5 rounded-xl text-sm font-medium transition-all touch-manipulation border whitespace-nowrap';

export const StockAlertsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('producto');
  const initialFiltro = searchParams.get('filtro') || 'todos';

  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(PERMISSIONS.PRODUCTOS_EDITAR);

  const [categories, setCategories] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState(initialFiltro);
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const debouncedSearch = useDebounce(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const highlightRef = useRef(null);

  useEffect(() => {
    categoryService
      .listActive()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const paramFiltro = searchParams.get('filtro');
    if (paramFiltro && paramFiltro !== filtro) {
      setFiltro(paramFiltro);
    }
  }, [searchParams]);

  const listParams = useMemo(() => {
    const params = {
      search: debouncedSearch,
      filtro: highlightId ? 'todos' : filtro,
    };
    if (categoriaFilter) params.categoria_id = categoriaFilter;
    if (highlightId) params.producto_id = highlightId;
    return params;
  }, [debouncedSearch, filtro, categoriaFilter, highlightId]);

  const {
    items: productos,
    pagination,
    loading,
    error: listError,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { productos: data, pagination: pag, resumen: summary } =
        await inventoryService.stockAlerts({ page, limit, ...params });
      setResumen(summary);
      return { data, pagination: pag };
    },
    params: listParams,
  });

  useEffect(() => {
    if (!highlightId || loading || !productos.length) return;
    const timer = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => clearTimeout(timer);
  }, [highlightId, loading, productos]);

  const categoriaOptions = useMemo(
    () => [
      { value: '', label: 'Todas las categorías' },
      ...categories.map((c) => ({ value: String(c.id), label: c.nombre })),
    ],
    [categories]
  );

  const handleFiltroChange = (value) => {
    setFiltro(value);
    const next = new URLSearchParams(searchParams);
    if (value === 'todos') next.delete('filtro');
    else next.set('filtro', value);
    setSearchParams(next, { replace: true });
  };

  const clearHighlight = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('producto');
    setSearchParams(next, { replace: true });
  };

  const openEdit = async (prod) => {
    try {
      const full = await productService.getById(prod.id);
      setEditing({
        id: full.id,
        values: {
          codigo: full.codigo,
          nombre: full.nombre,
          descripcion: full.descripcion || '',
          imagen_url: full.imagen_url || '',
          color: full.color || '',
          talle: full.talle || '',
          categoria_id: full.categoria_id,
          precio_venta: full.precio_venta,
          precio_costo: full.precio_costo,
          stock: full.stock,
          stock_minimo: full.stock_minimo,
          unidad_medida: full.unidad_medida,
          estado: full.estado,
        },
      });
      setModalOpen(true);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSubmit = async (data) => {
    if (!editing) return;
    setFormLoading(true);
    setError('');
    try {
      await productService.update(editing.id, data);
      setSuccess('Producto actualizado correctamente');
      setModalOpen(false);
      setEditing(null);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
          Alertas de stock
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Productos con stock bajo, sin unidades o en negativo
        </p>
      </div>

      {(error || listError) && <Alert>{error || listError}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {highlightId && (
        <Alert variant="info" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span>Mostrando el producto seleccionado desde una notificación.</span>
          <button
            type="button"
            onClick={clearHighlight}
            className="text-sm font-semibold underline shrink-0"
          >
            Ver todos
          </button>
        </Alert>
      )}

      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STOCK_ALERT_FILTERS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => handleFiltroChange(chip.value)}
              className={`text-left rounded-xl border p-4 transition-all ${
                filtro === chip.value
                  ? 'border-brand-400 bg-brand-50 shadow-sm ring-1 ring-brand-200'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <p className="text-xs text-slate-500">{chip.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">
                {resumen[chip.value] ?? 0}
              </p>
            </button>
          ))}
        </div>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 sm:p-6 pb-0">
          <FilterToolbar
            className="mb-4"
            onRefresh={refresh}
            search={
              <SearchInput
                id="buscar-alertas-stock"
                label="Buscar producto"
                placeholder="Código, nombre, color, talle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            }
            filters={[
              <Select
                key="categoria"
                id="filtro-categoria-alertas"
                label="Categoría"
                size="lg"
                hidePlaceholder
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                options={categoriaOptions}
              />,
            ]}
          />

          <div className="flex flex-wrap gap-2 mb-6">
            {STOCK_ALERT_FILTERS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => handleFiltroChange(chip.value)}
                className={`${chipBase} ${
                  filtro === chip.value
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {loading ? (
            <Spinner />
          ) : productos.length === 0 ? (
            <EmptyState
              title="Sin alertas de stock"
              description="No hay productos activos que coincidan con este filtro"
            />
          ) : (
            <>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full min-w-[960px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-4 py-3 font-medium w-16">Img</th>
                      <th className="px-4 py-3 font-medium">Código</th>
                      <th className="px-4 py-3 font-medium">Producto</th>
                      <th className="px-4 py-3 font-medium">Categoría</th>
                      <th className="px-4 py-3 font-medium">Stock</th>
                      <th className="px-4 py-3 font-medium">Mínimo</th>
                      <th className="px-4 py-3 font-medium">Diferencia</th>
                      <th className="px-4 py-3 font-medium">Alerta</th>
                      {canEdit && (
                        <th className="px-4 py-3 font-medium text-right">Acciones</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((prod) => {
                      const isHighlighted = highlightId && String(prod.id) === highlightId;
                      const tipoStyle =
                        STOCK_ALERT_TYPE_STYLES[prod.tipo_alerta] ||
                        STOCK_ALERT_TYPE_STYLES.bajo;

                      return (
                        <tr
                          key={prod.id}
                          ref={isHighlighted ? highlightRef : undefined}
                          className={`border-b border-slate-100 transition-colors ${
                            isHighlighted
                              ? 'bg-brand-50 ring-2 ring-inset ring-brand-300'
                              : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <ProductImage src={prod.imagen_url} alt={prod.nombre} size="sm" />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">
                            {prod.codigo}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{prod.nombre}</p>
                            <ProductMetaChips
                              color={prod.color}
                              talle={prod.talle}
                              className="mt-1"
                            />
                          </td>
                          <td className="px-4 py-3 text-slate-600">{prod.categoria_nombre}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`font-semibold tabular-nums ${
                                prod.stock < 0
                                  ? 'text-red-700'
                                  : prod.stock === 0
                                    ? 'text-red-600'
                                    : 'text-amber-700'
                              }`}
                            >
                              {formatNumber(prod.stock, 2)} {prod.unidad_medida}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600 tabular-nums">
                            {formatNumber(prod.stock_minimo, 2)}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            <span
                              className={
                                prod.diferencia < 0 ? 'text-red-600 font-medium' : 'text-slate-600'
                              }
                            >
                              {prod.diferencia > 0 ? '+' : ''}
                              {formatNumber(prod.diferencia, 2)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${tipoStyle}`}
                            >
                              {STOCK_ALERT_TYPE_LABELS[prod.tipo_alerta] || 'Alerta'}
                            </span>
                          </td>
                          {canEdit && (
                            <td className="px-4 py-3">
                              <div className="flex justify-end">
                                <Button variant="ghost" size="sm" onClick={() => openEdit(prod)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
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

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title="Editar producto"
        size="lg"
      >
        {editing && (
          <ProductForm
            key={editing.id}
            initialValues={editing.values}
            categories={categories}
            onSubmit={handleSubmit}
            isLoading={formLoading}
            submitLabel="Guardar cambios"
          />
        )}
      </Modal>
    </div>
  );
};

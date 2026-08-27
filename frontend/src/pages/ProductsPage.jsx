import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, PackageX, Package, Trash2, RotateCcw } from 'lucide-react';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
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
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { ProductForm } from '../components/forms/ProductForm';
import { ProductImage } from '../components/catalog/ProductImage';
import { ProductMetaChips } from '../components/catalog/ProductMetaChips';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';
import { formatProductPackageBadge, hasPaquetePricing } from '../utils/productPricing';
import { getErrorMessage } from '../utils/getErrorMessage';

export const ProductsPage = () => {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.PRODUCTOS_CREAR);
  const canEdit = hasPermission(PERMISSIONS.PRODUCTOS_EDITAR);
  const canDeactivate = hasPermission(PERMISSIONS.PRODUCTOS_DESACTIVAR);

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const debouncedSearch = useDebounce(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    categoryService
      .listActive()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const listParams = useMemo(() => {
    const params = {
      search: debouncedSearch,
      estado: showInactive ? 'inactivo' : 'activo',
    };
    if (categoriaFilter) params.categoria_id = categoriaFilter;
    return params;
  }, [debouncedSearch, showInactive, categoriaFilter]);

  const {
    items: products,
    pagination,
    loading,
    error: listError,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { products: data, pagination: pag } = await productService.list({
        page,
        limit,
        ...params,
      });
      return { data, pagination: pag };
    },
    params: listParams,
  });

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (prod) => {
    setEditing({
      id: prod.id,
      stockActual: prod.stock,
      values: {
        codigo: prod.codigo || '',
        nombre: prod.nombre,
        descripcion: prod.descripcion || '',
        imagen_url: prod.imagen_url || '',
        color: prod.color || '',
        talle: prod.talle || '',
        categoria_id: prod.categoria_id,
        precio_venta: prod.precio_venta,
        venta_por_paquete:
          prod.precio_venta_paquete != null &&
          Number(prod.precio_venta_paquete) > 0 &&
          Number(prod.unidades_por_paquete) > 0,
        precio_venta_paquete: prod.precio_venta_paquete ?? 0,
        unidades_por_paquete: Number(prod.unidades_por_paquete) > 0 ? Number(prod.unidades_por_paquete) : 1,
        precio_costo: prod.precio_costo,
        stock_minimo: prod.stock_minimo,
        unidad_medida: prod.unidad_medida,
        estado: prod.estado,
      },
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleCategoryCreated = (categoria) => {
    setCategories((prev) => {
      if (prev.some((c) => c.id === categoria.id)) return prev;
      return [...prev, categoria].sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
  };

  const handleSubmit = async (data) => {
    setFormLoading(true);
    setError('');
    try {
      if (editing) {
        await productService.update(editing.id, data);
        setSuccess('Producto actualizado correctamente');
      } else {
        await productService.create(data);
        setSuccess('Producto creado correctamente');
      }
      closeModal();
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (prod) => {
    if (!window.confirm(`¿Desactivar el producto "${prod.nombre}"?`)) return;
    try {
      await productService.deactivate(prod.id);
      setSuccess('Producto desactivado');
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (prod) => {
    if (
      !window.confirm(
        `¿Eliminar permanentemente "${prod.nombre}"?\n\nEsta acción no se puede deshacer. Solo es posible si el producto no tiene ventas asociadas.`
      )
    ) {
      return;
    }
    try {
      await productService.remove(prod.id);
      setSuccess('Producto eliminado de la base de datos');
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleReactivate = async (prod) => {
    if (!window.confirm(`¿Reactivar el producto "${prod.nombre}"?`)) return;
    try {
      await productService.update(prod.id, { estado: 'activo' });
      setSuccess('Producto reactivado');
      setShowInactive(false);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const categoriaOptions = [
    { value: '', label: 'Todas las categorías' },
    ...categories.map((c) => ({ value: c.id, label: c.nombre })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-7 h-7 text-brand-600" />
            Productos
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Catálogo de productos y precios — el stock se gestiona en Inventario
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Nuevo producto
          </Button>
        )}
      </div>

      {(error || listError) && <Alert>{error || listError}</Alert>}
      {success && (
        <Alert variant="success" className="flex justify-between items-center">
          {success}
          <button type="button" onClick={() => setSuccess('')} className="text-sm underline">
            Cerrar
          </button>
        </Alert>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 sm:p-6 pb-0">
          <FilterToolbar
            className="mb-6"
            onRefresh={refresh}
            search={
              <SearchInput
                id="buscar-productos"
                label="Buscar producto"
                placeholder="Código, nombre, color, talle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            }
            filters={[
              <Select
                key="categoria"
                id="filtro-categoria"
                label="Categoría"
                size="lg"
                hidePlaceholder
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                options={categoriaOptions}
              />,
              <div key="inactivos" className="flex items-end pb-1">
                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none min-h-[42px] px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
                    Mostrar inactivos
                  </span>
                </label>
              </div>,
            ]}
          />
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {loading ? (
            <Spinner />
          ) : products.length === 0 ? (
            <EmptyState
              title={showInactive ? 'Sin productos inactivos' : 'No hay productos'}
              description={
                showInactive
                  ? 'Los productos desactivados aparecerán aquí'
                  : 'Registre productos en su catálogo de ventas'
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full min-w-[980px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-4 py-3 font-medium w-16">Img</th>
                      <th className="px-4 py-3 font-medium">Código</th>
                      <th className="px-4 py-3 font-medium">Producto</th>
                      <th className="px-4 py-3 font-medium">Categoría</th>
                      <th className="px-4 py-3 font-medium">Precio venta (ARS)</th>
                      <th className="px-4 py-3 font-medium">Stock</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => (
                      <tr
                        key={prod.id}
                        className="border-b border-slate-100 hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3">
                          <ProductImage src={prod.imagen_url} alt={prod.nombre} size="sm" />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {prod.codigo || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{prod.nombre}</p>
                          <p className="text-xs text-slate-400 capitalize">{prod.unidad_medida}</p>
                          <ProductMetaChips color={prod.color} talle={prod.talle} className="mt-1" />
                          {hasPaquetePricing(prod) && (
                            <p className="mt-1 text-xs font-medium text-brand-700">
                              Paquete · {formatProductPackageBadge(prod)}
                              <span className="text-slate-500 font-normal">
                                {' '}
                                · {formatCurrency(prod.precio_venta_paquete)}
                              </span>
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{prod.categoria_nombre}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {formatCurrency(prod.precio_venta)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              prod.stock_bajo
                                ? 'text-red-600 font-medium'
                                : 'text-slate-700'
                            }
                          >
                            {formatNumber(prod.stock, 0)}
                          </span>
                          {prod.stock_bajo && (
                            <span className="ml-1 text-xs text-red-500">Bajo</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={prod.estado}>{prod.estado}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(prod)}
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {canEdit && prod.estado === 'inactivo' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!text-emerald-700 hover:!bg-emerald-50"
                                onClick={() => handleReactivate(prod)}
                                title="Reactivar"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                            )}
                            {canDeactivate && prod.puede_eliminar && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!text-red-700 hover:!bg-red-50"
                                onClick={() => handleDelete(prod)}
                                title="Eliminar permanentemente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                            {canDeactivate && prod.estado === 'activo' && !prod.puede_eliminar && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!text-amber-700 hover:!bg-amber-50"
                                onClick={() => handleDeactivate(prod)}
                                title="Desactivar (tiene ventas asociadas)"
                              >
                                <PackageX className="w-4 h-4" />
                              </Button>
                            )}
                            {canDeactivate && prod.estado === 'activo' && prod.puede_eliminar && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!text-slate-500 hover:!bg-slate-100"
                                onClick={() => handleDeactivate(prod)}
                                title="Desactivar"
                              >
                                <PackageX className="w-4 h-4" />
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
                itemLabel="productos"
              />
            </>
          )}
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        size="3xl"
        stickyFooter
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeModal} disabled={formLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="product-form"
              isLoading={formLoading}
              disabled={formLoading}
            >
              {editing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </>
        }
      >
        <ProductForm
          key={editing ? `edit-${editing.id}` : 'new-product'}
          formId="product-form"
          categories={categories}
          onCategoryCreated={handleCategoryCreated}
          isEditing={Boolean(editing)}
          defaultValues={editing?.values}
          stockActual={editing?.stockActual ?? null}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
};

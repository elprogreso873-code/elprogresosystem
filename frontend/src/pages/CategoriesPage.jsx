import { useState, useMemo } from 'react';
import { Plus, Pencil, FolderX, Tags } from 'lucide-react';
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
import { CategoryForm } from '../components/forms/CategoryForm';
import { formatDate } from '../utils/formatDate';
import { getErrorMessage } from '../utils/getErrorMessage';

export const CategoriesPage = () => {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.CATEGORIAS_CREAR);
  const canEdit = hasPermission(PERMISSIONS.CATEGORIAS_EDITAR);
  const canDeactivate = hasPermission(PERMISSIONS.CATEGORIAS_DESACTIVAR);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const debouncedSearch = useDebounce(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const listParams = useMemo(
    () => ({ search: debouncedSearch, estado: estadoFilter }),
    [debouncedSearch, estadoFilter]
  );

  const {
    items: categories,
    pagination,
    loading,
    error: listError,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { categories: data, pagination: pag } = await categoryService.list({
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

  const openEdit = (cat) => {
    setEditing({
      id: cat.id,
      values: {
        nombre: cat.nombre,
        descripcion: cat.descripcion || '',
        estado: cat.estado,
      },
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (data) => {
    setFormLoading(true);
    setError('');
    try {
      if (editing) {
        await categoryService.update(editing.id, data);
        setSuccess('Categoría actualizada correctamente');
      } else {
        await categoryService.create(data);
        setSuccess('Categoría creada correctamente');
      }
      closeModal();
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (cat) => {
    if (!window.confirm(`¿Desactivar la categoría "${cat.nombre}"?`)) return;
    try {
      await categoryService.deactivate(cat.id);
      setSuccess('Categoría desactivada');
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tags className="w-7 h-7 text-brand-600" />
            Categorías
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Clasificación de productos del catálogo
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Nueva categoría
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
                id="buscar-categorias"
                label="Buscar categoría"
                placeholder="Nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            }
            filters={[
              <Select
                key="estado"
                id="filtro-estado-cat"
                label="Estado"
                size="lg"
                hidePlaceholder
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                options={[
                  { value: 'todos', label: 'Todos' },
                  { value: 'activo', label: 'Activas' },
                  { value: 'inactivo', label: 'Inactivas' },
                ]}
              />,
            ]}
          />
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          {loading ? (
            <Spinner />
          ) : categories.length === 0 ? (
            <EmptyState
              title="No hay categorías"
              description="Cree categorías para organizar sus productos"
            />
          ) : (
            <>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-4 py-3 font-medium">Nombre</th>
                      <th className="px-4 py-3 font-medium hidden md:table-cell">Descripción</th>
                      <th className="px-4 py-3 font-medium">Productos</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium hidden lg:table-cell">Creado</th>
                      <th className="px-4 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr
                        key={cat.id}
                        className="border-b border-slate-100 hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">{cat.nombre}</td>
                        <td className="px-4 py-3 text-slate-500 hidden md:table-cell max-w-xs truncate">
                          {cat.descripcion || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                            {cat.total_productos}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={cat.estado}>{cat.estado}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                          {formatDate(cat.fecha_creacion)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {canEdit && (
                              <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {canDeactivate && cat.estado === 'activo' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="!text-red-600 hover:!bg-red-50"
                                onClick={() => handleDeactivate(cat)}
                              >
                                <FolderX className="w-4 h-4" />
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
                itemLabel="categorías"
              />
            </>
          )}
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
        size="md"
      >
        <CategoryForm
          defaultValues={editing?.values}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={formLoading}
        />
      </Modal>
    </div>
  );
};

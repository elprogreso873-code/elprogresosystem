import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Truck, ChevronRight } from 'lucide-react';
import { supplierService } from '../services/supplierService';
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
import { SupplierForm } from '../components/forms/SupplierForm';
import { formatCurrency } from '../utils/formatCurrency';
import { getErrorMessage } from '../utils/getErrorMessage';

export const SuppliersPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.PROVEEDORES_CREAR);
  const canEdit = hasPermission(PERMISSIONS.PROVEEDORES_EDITAR);
  const canDeactivate = hasPermission(PERMISSIONS.PROVEEDORES_DESACTIVAR);

  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('activo');
  const [soloDeuda, setSoloDeuda] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const debouncedSearch = useDebounce(search);

  const listParams = useMemo(
    () => ({ search: debouncedSearch, estado: estadoFilter, solo_deuda: soloDeuda }),
    [debouncedSearch, estadoFilter, soloDeuda]
  );

  const {
    items: suppliers,
    pagination,
    loading,
    error: listError,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { suppliers: data, pagination: pag } = await supplierService.list({
        page,
        limit,
        ...params,
      });
      return { data, pagination: pag };
    },
    params: listParams,
  });

  useEffect(() => {
    supplierService.summary().then(setSummary).catch(() => {});
  }, [suppliers]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditing({
      id: s.id,
      values: {
        nombre: s.nombre,
        cuit: s.cuit || '',
        email: s.email || '',
        telefono: s.telefono || '',
        direccion: s.direccion || '',
        observaciones: s.observaciones || '',
        estado: s.estado,
      },
    });
    setModalOpen(true);
  };

  const handleSubmit = async (data) => {
    setFormLoading(true);
    setError('');
    try {
      if (editing) {
        await supplierService.update(editing.id, data);
        setSuccess('Proveedor actualizado');
      } else {
        await supplierService.create(data);
        setSuccess('Proveedor creado');
      }
      setModalOpen(false);
      setEditing(null);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (s) => {
    if (!window.confirm(`¿Desactivar a ${s.nombre}?`)) return;
    try {
      await supplierService.deactivate(s.id);
      setSuccess('Proveedor desactivado');
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-brand-600" />
            Proveedores
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Saldos, compras pendientes y pagos</p>
        </div>
        {canCreate && (
          <Button size="lg" onClick={openCreate}>
            <Plus className="w-5 h-5" />
            Nuevo proveedor
          </Button>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <Card className="!p-4">
            <p className="text-xs text-slate-500">Con saldo</p>
            <p className="text-xl font-bold">{summary.proveedores_con_deuda}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-slate-500">Total a pagar</p>
            <p className="text-xl font-bold text-amber-700 tabular-nums">
              {formatCurrency(summary.total_por_pagar)}
            </p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-slate-500">Movimientos hoy</p>
            <p className="text-xl font-bold">{summary.movimientos_hoy}</p>
          </Card>
        </div>
      )}

      <Card>
        <FilterToolbar
          className="mb-6"
          onRefresh={refresh}
          search={
            <SearchInput
              id="buscar-proveedores"
              label="Buscar"
              placeholder="Nombre, CUIT o teléfono"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          }
          filters={[
            <Select
              key="e"
              id="filtro-estado-prov"
              label="Estado"
              size="lg"
              hidePlaceholder
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              options={[
                { value: 'todos', label: 'Todos' },
                { value: 'activo', label: 'Activos' },
                { value: 'inactivo', label: 'Inactivos' },
              ]}
            />,
            <Select
              key="d"
              id="filtro-deuda-prov"
              label="Saldo"
              size="lg"
              hidePlaceholder
              value={soloDeuda ? 'deuda' : 'todos'}
              onChange={(e) => setSoloDeuda(e.target.value === 'deuda')}
              options={[
                { value: 'todos', label: 'Todos los saldos' },
                { value: 'deuda', label: 'Con saldo' },
              ]}
            />,
          ]}
        />

        {loading ? (
          <Spinner />
        ) : suppliers.length === 0 ? (
          <EmptyState title="Sin proveedores" description="Cree el primero para registrar compras" />
        ) : (
          <>
            <div className="space-y-3">
              {suppliers.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <button
                    type="button"
                    className="flex-1 text-left min-w-0"
                    onClick={() => navigate(`/proveedores/${s.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 truncate">{s.nombre}</p>
                      <Badge variant={s.estado === 'activo' ? 'activo' : 'inactivo'}>{s.estado}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[s.cuit, s.telefono].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                    </p>
                    {s.compras_pendientes > 0 && (
                      <p className="text-xs text-amber-700 mt-1">
                        {s.compras_pendientes} compra{s.compras_pendientes !== 1 ? 's' : ''} pendiente
                        {s.compras_pendientes !== 1 ? 's' : ''}
                      </p>
                    )}
                  </button>
                  <p
                    className={`font-bold tabular-nums ${
                      s.saldo > 0 ? 'text-amber-700' : 'text-slate-500'
                    }`}
                  >
                    {formatCurrency(s.saldo)}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/proveedores/${s.id}`)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {canDeactivate && s.estado === 'activo' && (
                      <Button variant="ghost" size="sm" onClick={() => handleDeactivate(s)}>
                        Desactivar
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
              itemLabel="proveedores"
            />
          </>
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Editar proveedor' : 'Nuevo proveedor'}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} disabled={formLoading}>
              Cancelar
            </Button>
            <Button type="submit" form="supplier-form" isLoading={formLoading}>
              {editing ? 'Guardar' : 'Crear'}
            </Button>
          </>
        }
      >
        <SupplierForm
          key={editing ? `edit-${editing.id}` : 'new'}
          defaultValues={editing?.values}
          isEditing={Boolean(editing)}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
};

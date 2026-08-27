import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Pencil, UserX, Users, BookOpen } from 'lucide-react';
import { clientService } from '../services/clientService';
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
import { ClientForm } from '../components/forms/ClientForm';
import { formatCurrency } from '../utils/formatCurrency';
import { getErrorMessage } from '../utils/getErrorMessage';

export const ClientsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pendingEditRef = useRef(null);
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.CLIENTES_CREAR);
  const canEdit = hasPermission(PERMISSIONS.CLIENTES_EDITAR);
  const canDeactivate = hasPermission(PERMISSIONS.CLIENTES_DESACTIVAR);
  const canViewCC = hasPermission(
    PERMISSIONS.CUENTA_CORRIENTE_VER,
    PERMISSIONS.CUENTA_CORRIENTE_COBRAR
  );

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [info, setInfo] = useState(() => location.state?.message || '');
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const debouncedSearch = useDebounce(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [editing, setEditing] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const openCreate = () => {
    setFormKey((k) => k + 1);
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (client) => {
    setFormKey((k) => k + 1);
    setEditing({
      id: client.id,
      values: {
        tipo_documento: client.tipo_documento,
        numero_documento: client.numero_documento || '',
        nombre: client.nombre,
        email: client.email || '',
        telefono: client.telefono || '',
        direccion: client.direccion || '',
        estado: client.estado,
        limite_credito: client.limite_credito ?? '',
      },
    });
    setModalOpen(true);
  };

  const listParams = useMemo(
    () => ({ search: debouncedSearch, estado: estadoFilter }),
    [debouncedSearch, estadoFilter]
  );

  const {
    items: clients,
    pagination,
    loading,
    error: listError,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { clients: data, pagination: pag } = await clientService.list({
        page,
        limit,
        ...params,
      });
      return { data, pagination: pag };
    },
    params: listParams,
  });

  useEffect(() => {
    if (location.state?.message) {
      setInfo(location.state.message);
    }
  }, [location.state?.message]);

  useEffect(() => {
    if (!info) return;
    const t = setTimeout(() => setInfo(''), 10000);
    return () => clearTimeout(t);
  }, [info]);

  useEffect(() => {
    const editId = location.state?.editClientId;
    if (!editId || !canEdit) return;
    if (pendingEditRef.current === editId) return;
    pendingEditRef.current = editId;

    clientService
      .getById(editId)
      .then((client) => {
        openEdit(client);
        navigate(location.pathname, { replace: true, state: {} });
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => {
        pendingEditRef.current = null;
      });
  }, [location.state?.editClientId, canEdit, navigate, location.pathname]);

  const handleSubmit = async (data) => {
    setFormLoading(true);
    try {
      if (editing) {
        await clientService.update(editing.id, data);
        setSuccess('Cliente actualizado');
      } else {
        await clientService.create(data);
        setSuccess('Cliente creado');
      }
      closeModal();
      refresh();
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
            <Users className="w-7 h-7 text-brand-600" />
            Clientes
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Base de clientes para ventas</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> Nuevo cliente
          </Button>
        )}
      </div>

      {(error || listError) && <Alert>{error || listError}</Alert>}
      {info && <Alert variant="info">{info}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 sm:p-6 pb-0">
          <FilterToolbar
            className="mb-6"
            onRefresh={refresh}
            search={<SearchInput id="buscar-clientes" label="Buscar cliente" placeholder="Nombre, documento, teléfono..." value={search} onChange={(e) => setSearch(e.target.value)} />}
            filters={[
              <Select key="e" id="estado-c" label="Estado" size="lg" hidePlaceholder value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)} options={[{ value: 'todos', label: 'Todos' }, { value: 'activo', label: 'Activos' }, { value: 'inactivo', label: 'Inactivos' }]} />,
            ]}
          />
        </div>
        <div className="px-4 sm:px-6 pb-6">
          {loading ? <Spinner /> : clients.length === 0 ? (
            <EmptyState title="Sin clientes" description="Registre su primer cliente" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-4 py-3 text-left font-medium">Cliente</th>
                      <th className="px-4 py-3 text-left font-medium">Documento</th>
                      <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Contacto</th>
                      <th className="px-4 py-3 text-left font-medium">Estado</th>
                      <th className="px-4 py-3 text-right font-medium">Saldo CC</th>
                      <th className="px-4 py-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-800">{c.nombre}</td>
                        <td className="px-4 py-3 text-slate-600">{c.tipo_documento} {c.numero_documento || '—'}</td>
                        <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{c.telefono || c.email || '—'}</td>
                        <td className="px-4 py-3"><Badge variant={c.estado}>{c.estado}</Badge></td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={c.saldo_cuenta_corriente > 0 ? 'font-semibold text-amber-700' : 'text-slate-500'}>
                            {formatCurrency(c.saldo_cuenta_corriente ?? 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {canViewCC && c.estado === 'activo' && (
                              <Link to={`/clientes/cuenta-corriente/${c.id}`}>
                                <Button variant="ghost" size="sm" title="Cuenta corriente">
                                  <BookOpen className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}
                            {canEdit && (
                              <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {canDeactivate && c.estado === 'activo' && <Button variant="ghost" size="sm" className="!text-red-600" onClick={async () => { if (confirm(`¿Desactivar "${c.nombre}"?`)) { await clientService.deactivate(c.id); refresh(); } }}><UserX className="w-4 h-4" /></Button>}
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
                itemLabel="clientes"
              />
            </>
          )}
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar cliente' : 'Nuevo cliente'}
        size="xl"
        stickyFooter
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeModal} disabled={formLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="client-form"
              isLoading={formLoading}
              disabled={formLoading}
            >
              {editing ? 'Guardar cambios' : 'Crear cliente'}
            </Button>
          </>
        }
      >
        <ClientForm
          key={formKey}
          formId="client-form"
          isEditing={!!editing}
          defaultValues={editing?.values}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
};

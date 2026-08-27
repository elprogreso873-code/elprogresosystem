import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, UserX } from 'lucide-react';
import { userService } from '../services/userService';
import { useDebounce } from '../hooks/useDebounce';
import { usePaginatedList } from '../hooks/usePaginatedList';
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
import { UserForm } from '../components/forms/UserForm';
import { formatDate } from '../utils/formatDate';
import { getErrorMessage } from '../utils/getErrorMessage';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';

export const UsersPage = () => {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.USUARIOS_CREAR);
  const canEdit = hasPermission(PERMISSIONS.USUARIOS_EDITAR);
  const canDeactivate = hasPermission(PERMISSIONS.USUARIOS_DESACTIVAR);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const debouncedSearch = useDebounce(search);

  const [modalMode, setModalMode] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const listParams = useMemo(
    () => ({ search: debouncedSearch, estado: estadoFilter }),
    [debouncedSearch, estadoFilter]
  );

  const {
    items: users,
    pagination,
    loading,
    error: listError,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { users: data, pagination: pag } = await userService.list({
        page,
        limit,
        ...params,
      });
      return { data, pagination: pag };
    },
    params: listParams,
  });

  useEffect(() => {
    userService.getRoles().then(setRoles).catch(() => {});
  }, []);

  const openCreate = () => {
    setSelectedUser(null);
    setModalMode('create');
  };

  const openEdit = (user) => {
    setSelectedUser({
      nombre_usuario: user.nombre_usuario,
      contrasena: '',
      rol_id: user.rol_id,
      estado: user.estado,
    });
    setModalMode('edit');
    setEditingId(user.id);
  };

  const [editingId, setEditingId] = useState(null);

  const closeModal = () => {
    setModalMode(null);
    setSelectedUser(null);
    setEditingId(null);
  };

  const handleCreate = async (data) => {
    setFormLoading(true);
    try {
      await userService.create(data);
      setSuccess('Usuario creado correctamente');
      closeModal();
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data) => {
    setFormLoading(true);
    try {
      await userService.update(editingId, data);
      setSuccess('Usuario actualizado correctamente');
      closeModal();
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (user) => {
    if (!window.confirm(`¿Desactivar al usuario "${user.nombre_usuario}"?`)) return;
    try {
      await userService.deactivate(user.id);
      setSuccess('Usuario desactivado');
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de usuarios</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Alta, edición y desactivación lógica de cuentas
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Nuevo usuario
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
        <div className="p-4 sm:p-6 pb-0 sm:pb-0">
          <FilterToolbar
            className="mb-6"
            onRefresh={refresh}
            search={
              <SearchInput
                id="buscar-usuarios"
                label="Buscar usuario"
                placeholder="Escriba el nombre de usuario..."
                hint="La búsqueda se aplica automáticamente"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            }
            filters={[
              <Select
                key="estado"
                id="filtro-estado"
                label="Estado"
                size="lg"
                hidePlaceholder
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                options={[
                  { value: 'todos', label: 'Todos los estados' },
                  { value: 'activo', label: 'Solo activos' },
                  { value: 'inactivo', label: 'Solo inactivos' },
                ]}
              />,
            ]}
          />
        </div>

        <div className="px-4 sm:px-6 pb-4 sm:pb-6">

        {loading ? (
          <Spinner />
        ) : users.length === 0 ? (
          <EmptyState
            title="No hay usuarios"
            description="Cree un nuevo usuario o ajuste los filtros de búsqueda"
          />
        ) : (
          <>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="px-4 py-3 font-medium">Usuario</th>
                    <th className="px-4 py-3 font-medium">Rol</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Creado</th>
                    <th className="px-4 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {user.nombre_usuario}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.rol}>{user.rol}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.estado}>{user.estado}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                        {formatDate(user.fecha_creacion)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(user)}
                              aria-label="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {canDeactivate && user.estado === 'activo' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="!text-red-600 hover:!bg-red-50"
                              onClick={() => handleDeactivate(user)}
                              aria-label="Desactivar"
                            >
                              <UserX className="w-4 h-4" />
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
              itemLabel="usuarios"
            />
          </>
        )}
        </div>
      </Card>

      <Modal
        isOpen={modalMode === 'create'}
        onClose={closeModal}
        title="Crear usuario"
        size="md"
      >
        <UserForm
          mode="create"
          roles={roles}
          onSubmit={handleCreate}
          onCancel={closeModal}
          isLoading={formLoading}
        />
      </Modal>

      <Modal
        isOpen={modalMode === 'edit'}
        onClose={closeModal}
        title="Editar usuario"
        size="md"
      >
        <UserForm
          mode="edit"
          defaultValues={selectedUser}
          roles={roles}
          onSubmit={handleUpdate}
          onCancel={closeModal}
          isLoading={formLoading}
        />
      </Modal>
    </div>
  );
};

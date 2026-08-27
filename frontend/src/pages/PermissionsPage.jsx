import { useState, useEffect } from 'react';
import { Shield, Save, UserCog } from 'lucide-react';
import { permissionService } from '../services/permissionService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { FilterToolbar } from '../components/common/FilterToolbar';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { getErrorMessage } from '../utils/getErrorMessage';
import { usePermissions } from '../hooks/usePermissions';
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  PERMISSIONS,
} from '../constants/permissions';

export const PermissionsPage = () => {
  const { hasPermission, isAdmin } = usePermissions();
  const canEdit = isAdmin || hasPermission(PERMISSIONS.PERMISOS_ASIGNAR);

  const [empleados, setEmpleados] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [permisos, setPermisos] = useState([]);
  const [esAdmin, setEsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    permissionService
      .listEmployees()
      .then(setEmpleados)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setPermisos([]);
      setEsAdmin(false);
      return;
    }

    setLoading(true);
    setError('');
    permissionService
      .getByUser(selectedId)
      .then((data) => {
        setPermisos(data.permisos);
        setEsAdmin(data.es_admin);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const togglePermiso = (permisoId, codigo) => {
    if (!canEdit || esAdmin) return;
    if (codigo === PERMISSIONS.DASHBOARD_VER) return;

    setPermisos((prev) =>
      prev.map((p) =>
        p.id === permisoId ? { ...p, asignado: !p.asignado } : p
      )
    );
  };

  const handleSave = async () => {
    if (!selectedId || !canEdit) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const ids = permisos.filter((p) => p.asignado).map((p) => p.id);
      await permissionService.assign(selectedId, ids);
      setSuccess(
        'Permisos guardados. El empleado verá los cambios al volver a iniciar sesión.'
      );
      const data = await permissionService.getByUser(selectedId);
      setPermisos(data.permisos);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const empleadoOptions = empleados.map((e) => ({
    value: e.id,
    label: e.nombre_usuario,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="w-7 h-7 text-brand-600" />
          Permisos de empleados
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Defina qué módulos y acciones puede usar cada empleado
        </p>
      </div>

      {error && <Alert>{error}</Alert>}
      {success && (
        <Alert variant="success" className="flex justify-between items-center">
          {success}
          <button type="button" onClick={() => setSuccess('')} className="text-sm underline">
            Cerrar
          </button>
        </Alert>
      )}

      <Card>
        <FilterToolbar
          className="mb-6"
          filters={[
            <Select
              key="empleado"
              id="empleado"
              label="Empleado"
              size="lg"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              options={empleadoOptions}
              placeholder="Seleccione un empleado..."
            />,
            selectedId && canEdit && !esAdmin ? (
              <div key="guardar" className="flex items-end w-full sm:w-auto">
                <Button
                  onClick={handleSave}
                  isLoading={saving}
                  size="md"
                  className="h-11 w-full sm:w-auto"
                >
                  <Save className="w-4 h-4" />
                  Guardar permisos
                </Button>
              </div>
            ) : null,
          ].filter(Boolean)}
        />

        {!selectedId && (
          <div className="flex flex-col items-center py-12 text-slate-400">
            <UserCog className="w-12 h-12 mb-3" />
            <p>Seleccione un empleado para ver y editar sus permisos</p>
          </div>
        )}

        {selectedId && loading && <Spinner />}

        {selectedId && !loading && esAdmin && (
          <Alert variant="info">
            Los administradores tienen acceso total. Sus permisos no se pueden modificar.
          </Alert>
        )}

        {selectedId && !loading && !esAdmin && (
          <div className="space-y-6">
            {PERMISSION_GROUPS.map((group) => {
              const groupPerms = permisos.filter((p) =>
                group.permisos.includes(p.codigo)
              );
              if (!groupPerms.length) return null;

              return (
                <div
                  key={group.modulo}
                  className="border border-slate-200 rounded-xl overflow-hidden"
                >
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">{group.titulo}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Módulo: {group.modulo}
                    </p>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {groupPerms.map((perm) => {
                      const isDashboard = perm.codigo === PERMISSIONS.DASHBOARD_VER;
                      const disabled = !canEdit || isDashboard;

                      return (
                        <li
                          key={perm.id}
                          className="flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50/80 transition-colors"
                        >
                          <input
                            type="checkbox"
                            id={`perm-${perm.id}`}
                            checked={perm.asignado}
                            disabled={disabled}
                            onChange={() => togglePermiso(perm.id, perm.codigo)}
                            className="w-5 h-5 rounded-md border-slate-300 text-brand-500 focus:ring-2 focus:ring-brand-400/40 focus:ring-offset-0 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <label
                            htmlFor={`perm-${perm.id}`}
                            className={`flex-1 text-sm ${disabled ? 'text-slate-500' : 'text-slate-700 cursor-pointer'}`}
                          >
                            {PERMISSION_LABELS[perm.codigo] || perm.descripcion}
                            {isDashboard && (
                              <span className="ml-2 text-xs text-slate-400">
                                (obligatorio)
                              </span>
                            )}
                          </label>
                          <Badge variant={perm.asignado ? 'activo' : 'inactivo'}>
                            {perm.asignado ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

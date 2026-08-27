import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Plus, Pencil, ToggleLeft, Star } from 'lucide-react';
import { paymentMethodService } from '../services/paymentMethodService';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/common/EmptyState';
import { PaymentMethodForm } from '../components/forms/PaymentMethodForm';
import { getErrorMessage } from '../utils/getErrorMessage';

const flagLabels = [
  ['requiere_monto_recibido', 'Monto/vuelto'],
  ['registra_en_caja', 'Caja'],
  ['requiere_cliente', 'Cliente'],
  ['genera_cargo_cc', 'Cta. cte.'],
];

export const PaymentMethodsConfigPage = () => {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(PERMISSIONS.METODOS_PAGO_GESTIONAR);

  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [modalMode, setModalMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await paymentMethodService.list({
        estado: estadoFilter === 'todos' ? 'todos' : estadoFilter,
      });
      setMethods(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [estadoFilter]);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  useEffect(() => {
    if (!success) return undefined;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const openCreate = () => {
    setEditing(null);
    setModalMode('create');
  };

  const openEdit = (method) => {
    setEditing({
      id: method.id,
      values: {
        nombre: method.nombre,
        descripcion: method.descripcion || '',
        requiere_cliente: method.requiere_cliente,
        requiere_monto_recibido: method.requiere_monto_recibido,
        registra_en_caja: method.registra_en_caja,
        genera_cargo_cc: method.genera_cargo_cc,
        es_predeterminado: method.es_predeterminado,
        orden: method.orden,
        estado: method.estado,
      },
    });
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditing(null);
  };

  const handleSubmit = async (data) => {
    setFormLoading(true);
    setError('');
    try {
      if (modalMode === 'edit') {
        await paymentMethodService.update(editing.id, data);
        setSuccess('Método actualizado');
      } else {
        await paymentMethodService.create(data);
        setSuccess('Método creado');
      }
      closeModal();
      fetchMethods();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetDefault = async (method) => {
    if (method.es_predeterminado) return;
    setError('');
    try {
      await paymentMethodService.update(method.id, { es_predeterminado: true });
      setSuccess(`"${method.nombre}" es ahora el predeterminado`);
      fetchMethods();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeactivate = async (method) => {
    if (!window.confirm(`¿Desactivar "${method.nombre}"? No aparecerá en nuevas ventas.`)) {
      return;
    }
    setError('');
    try {
      await paymentMethodService.deactivate(method.id);
      setSuccess('Método desactivado');
      fetchMethods();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleReactivate = async (method) => {
    setError('');
    try {
      await paymentMethodService.update(method.id, { estado: 'activo' });
      setSuccess('Método reactivado');
      fetchMethods();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!canManage) {
    return (
      <div className="p-6">
        <Alert variant="warning">No tiene permiso para configurar métodos de pago.</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-brand-600" />
            Métodos de pago
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Configure qué opciones verán los vendedores al cobrar (efectivo, transferencia, tarjeta,
            cuenta corriente, etc.).
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus className="w-4 h-4" />
          Nuevo método
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <div className="flex flex-wrap gap-3 mb-6">
          <Select
            id="filtro-estado-mp"
            label="Estado"
            className="max-w-xs"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            hidePlaceholder
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'activo', label: 'Activos' },
              { value: 'inactivo', label: 'Inactivos' },
            ]}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : methods.length === 0 ? (
          <EmptyState
            title="Sin métodos"
            description="Cree el primer método de pago para usarlo en ventas."
          />
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-3 px-2 font-medium">Método</th>
                  <th className="pb-3 px-2 font-medium">Código</th>
                  <th className="pb-3 px-2 font-medium">Comportamiento</th>
                  <th className="pb-3 px-2 font-medium">Orden</th>
                  <th className="pb-3 px-2 font-medium">Estado</th>
                  <th className="pb-3 px-2 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 px-2">
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        {m.nombre}
                        {m.es_predeterminado && (
                          <Badge variant="admin" className="!text-xs">
                            <Star className="w-3 h-3 mr-0.5 inline" />
                            Predeterminado
                          </Badge>
                        )}
                      </div>
                      {m.descripcion && (
                        <p className="text-xs text-slate-500 mt-0.5">{m.descripcion}</p>
                      )}
                    </td>
                    <td className="py-4 px-2 font-mono text-xs text-slate-600">{m.codigo}</td>
                    <td className="py-4 px-2">
                      <div className="flex flex-wrap gap-1">
                        {flagLabels.map(([key, label]) =>
                          m[key] ? (
                            <Badge key={key} variant="empleado" className="!text-xs">
                              {label}
                            </Badge>
                          ) : null
                        )}
                        {!flagLabels.some(([key]) => m[key]) && (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2 text-slate-700">{m.orden}</td>
                    <td className="py-4 px-2">
                      <Badge variant={m.estado === 'activo' ? 'activo' : 'inactivo'}>
                        {m.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex justify-end flex-wrap gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(m)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {m.estado === 'activo' && !m.es_predeterminado && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(m)}
                            title="Marcar predeterminado"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        {m.estado === 'activo' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(m)}
                            title="Desactivar"
                          >
                            <ToggleLeft className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivate(m)}
                          >
                            Activar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={Boolean(modalMode)}
        onClose={closeModal}
        title={modalMode === 'edit' ? 'Editar método de pago' : 'Nuevo método de pago'}
      >
        <PaymentMethodForm
          mode={modalMode}
          defaultValues={editing?.values}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isLoading={formLoading}
        />
      </Modal>
    </div>
  );
};

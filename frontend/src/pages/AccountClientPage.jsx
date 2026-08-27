import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  SlidersHorizontal,
  Pencil,
  Wallet,
  CreditCard,
  History,
  User,
} from 'lucide-react';
import { cuentaCorrienteService } from '../services/cuentaCorrienteService';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { AccountPaymentForm } from '../components/forms/AccountPaymentForm';
import { AccountAdjustmentForm } from '../components/forms/AccountAdjustmentForm';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { getErrorMessage } from '../utils/getErrorMessage';

const tipoMovLabel = {
  cargo: 'Cargo (venta)',
  pago: 'Cobro',
  ajuste: 'Ajuste',
  anulacion: 'Anulación',
};

const tipoMovVariant = {
  cargo: 'inactivo',
  pago: 'activo',
  ajuste: 'admin',
  anulacion: 'empleado',
};

const MovementCard = ({ movement: m }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <Badge variant={tipoMovVariant[m.tipo] || 'activo'} className="text-[10px]">
        {tipoMovLabel[m.tipo] || m.tipo}
      </Badge>
      <span className="text-xs text-slate-500">{formatDate(m.fecha)}</span>
    </div>
    <div className="flex justify-between items-baseline">
      <span
        className={`font-bold tabular-nums ${
          m.tipo === 'pago' || m.tipo === 'anulacion' ? 'text-emerald-700' : 'text-slate-800'
        }`}
      >
        {m.tipo === 'pago' || m.tipo === 'anulacion' ? '−' : '+'}
        {formatCurrency(m.monto)}
      </span>
      <span className="text-sm text-slate-600 tabular-nums">
        Saldo {formatCurrency(m.saldo_posterior)}
      </span>
    </div>
    {(m.metodo_cobro_nombre || m.metodo_cobro || m.venta_numero || m.observaciones) && (
      <div className="text-xs text-slate-600 pt-1 border-t border-slate-100">
        {(m.metodo_cobro_nombre || m.metodo_cobro) && m.tipo === 'pago' && (
          <p className="font-medium text-slate-700">
            {m.metodo_cobro_nombre || m.metodo_cobro}
          </p>
        )}
        {m.venta_numero && (
          <Link to={`/ventas/${m.venta_id}`} className="text-brand-700 font-medium hover:underline">
            {m.venta_numero}
          </Link>
        )}
        {m.observaciones && <p className="mt-0.5">{m.observaciones}</p>}
        <p className="text-slate-400 mt-1">{m.usuario_nombre}</p>
      </div>
    )}
  </div>
);

export const AccountClientPage = () => {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canPay = hasPermission(PERMISSIONS.CUENTA_CORRIENTE_COBRAR);
  const canAdjust = hasPermission(PERMISSIONS.CUENTA_CORRIENTE_AJUSTAR);
  const canEditClient = hasPermission(PERMISSIONS.CLIENTES_EDITAR);
  const { methods: paymentMethods, defaultMethod } = usePaymentMethods({ activos: true });

  const [client, setClient] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payModal, setPayModal] = useState(false);
  const [adjustModal, setAdjustModal] = useState(false);
  const [payFormKey, setPayFormKey] = useState(0);
  const [adjustFormKey, setAdjustFormKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const loadClient = useCallback(async () => {
    try {
      const c = await cuentaCorrienteService.getClient(clienteId);
      setClient(c);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [clienteId]);

  const listParams = useMemo(() => ({ clienteId }), [clienteId]);

  const {
    items: movements,
    pagination,
    loading,
    error: listError,
    setPage,
    setLimit,
    refresh: refreshMovements,
  } = usePaginatedList({
    queryFn: async ({ page, limit }) => {
      const { movements: data, pagination: pag } = await cuentaCorrienteService.movements(
        clienteId,
        { page, limit }
      );
      return { data, pagination: pag };
    },
    params: listParams,
    defaultLimit: 15,
    enabled: Boolean(clienteId),
  });

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(t);
  }, [success]);

  const refresh = async () => {
    await loadClient();
    refreshMovements();
  };

  const cobroMetodos = paymentMethods.filter((m) => !m.genera_cargo_cc);
  const defaultCobroMetodo =
    cobroMetodos.find((m) => m.codigo === defaultMethod?.codigo) || cobroMetodos[0];

  const openPayModal = () => {
    setPayFormKey((k) => k + 1);
    setPayModal(true);
  };

  const openAdjustModal = () => {
    setAdjustFormKey((k) => k + 1);
    setAdjustModal(true);
  };

  const handlePay = async (data) => {
    setSubmitting(true);
    setError('');
    try {
      await cuentaCorrienteService.registerPayment(clienteId, data);
      setSuccess('Cobro registrado correctamente');
      setPayModal(false);
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjust = async (data) => {
    setSubmitting(true);
    setError('');
    try {
      await cuentaCorrienteService.registerAdjustment(clienteId, data);
      setSuccess('Ajuste registrado correctamente');
      setAdjustModal(false);
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const goEditClient = () => {
    navigate('/clientes/listado', { state: { editClientId: Number(clienteId) } });
  };

  if (!client && loading && movements.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!client) return <Alert>{error || 'Cliente no encontrado'}</Alert>;

  const saldo = client.saldo_cuenta_corriente;
  const creditoDisponible =
    client.limite_credito != null
      ? Math.max(0, Number(client.limite_credito) - saldo)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link
          to="/clientes/cuenta-corriente"
          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 shrink-0 touch-manipulation"
          aria-label="Volver al listado"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              {client.nombre}
            </h1>
            <Badge variant={client.estado}>{client.estado}</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-2">
            <span className="inline-flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {client.tipo_documento} {client.numero_documento || '—'}
            </span>
            {client.telefono && <span>{client.telefono}</span>}
            {client.email && <span className="hidden sm:inline">{client.email}</span>}
          </p>
        </div>
      </div>

      {(error || listError) && <Alert>{error || listError}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="!p-5 border-l-4 border-l-amber-500">
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <Wallet className="w-4 h-4" /> Saldo actual
          </p>
          <p className="text-2xl font-bold text-amber-800 tabular-nums mt-1">
            {formatCurrency(saldo)}
          </p>
        </Card>
        <Card className="!p-5">
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <CreditCard className="w-4 h-4" /> Límite de crédito
          </p>
          <p className="text-2xl font-bold text-slate-800 tabular-nums mt-1">
            {client.limite_credito != null ? formatCurrency(client.limite_credito) : 'Sin límite'}
          </p>
        </Card>
        <Card className="!p-5 border-l-4 border-l-emerald-500">
          <p className="text-sm text-slate-500">Crédito disponible</p>
          <p className="text-2xl font-bold text-emerald-700 tabular-nums mt-1">
            {creditoDisponible != null ? formatCurrency(creditoDisponible) : '—'}
          </p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {canPay && saldo > 0 && (
          <Button onClick={openPayModal} className="min-h-11 touch-manipulation">
            <Banknote className="w-4 h-4" />
            Registrar cobro
          </Button>
        )}
        {canAdjust && (
          <Button variant="outline" onClick={openAdjustModal} className="min-h-11 touch-manipulation">
            <SlidersHorizontal className="w-4 h-4" />
            Ajuste manual
          </Button>
        )}
        {canEditClient && (
          <Button variant="ghost" onClick={goEditClient} className="min-h-11">
            <Pencil className="w-4 h-4" />
            Editar cliente
          </Button>
        )}
      </div>

      <Card className="!p-0 overflow-hidden" title={null}>
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <History className="w-5 h-5 text-brand-600" />
          <h2 className="font-semibold text-slate-800">Historial de movimientos</h2>
        </div>
        <div className="px-4 sm:px-6 pb-6 pt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : movements.length === 0 ? (
            <EmptyState
              title="Sin movimientos"
              description="Aún no hay cargos, cobros ni ajustes para este cliente"
            />
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {movements.map((m) => (
                  <MovementCard key={m.id} movement={m} />
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium text-right">Monto</th>
                      <th className="px-4 py-3 font-medium text-right">Saldo</th>
                      <th className="px-4 py-3 font-medium">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                          {formatDate(m.fecha)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={tipoMovVariant[m.tipo] || 'activo'}>
                            {tipoMovLabel[m.tipo] || m.tipo}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {m.tipo === 'pago' || m.tipo === 'anulacion' ? '−' : '+'}
                          {formatCurrency(m.monto)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                          {formatCurrency(m.saldo_posterior)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs max-w-[220px]">
                          {(m.metodo_cobro_nombre || m.metodo_cobro) && m.tipo === 'pago' && (
                            <span className="block font-medium text-slate-700 mb-0.5">
                              {m.metodo_cobro_nombre || m.metodo_cobro}
                            </span>
                          )}
                          {m.venta_numero && (
                            <Link
                              to={`/ventas/${m.venta_id}`}
                              className="text-brand-700 hover:underline font-medium"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {m.venta_numero}
                            </Link>
                          )}
                          {m.observaciones && (
                            <span className={m.venta_numero ? ' block mt-0.5' : ''}>
                              {m.observaciones}
                            </span>
                          )}
                          <span className="block text-slate-400 mt-0.5">{m.usuario_nombre}</span>
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
        isOpen={payModal}
        onClose={() => setPayModal(false)}
        title="Registrar cobro"
        size="lg"
        stickyFooter
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setPayModal(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" form="account-payment-form" isLoading={submitting} disabled={submitting}>
              Confirmar cobro
            </Button>
          </>
        }
      >
        <AccountPaymentForm
          key={payFormKey}
          formId="account-payment-form"
          saldoPendiente={saldo}
          paymentMethods={cobroMetodos}
          defaultMetodo={defaultCobroMetodo?.codigo || 'efectivo'}
          onSubmit={handlePay}
        />
      </Modal>

      <Modal
        isOpen={adjustModal}
        onClose={() => setAdjustModal(false)}
        title="Ajuste de saldo"
        size="md"
        stickyFooter
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setAdjustModal(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="account-adjustment-form"
              isLoading={submitting}
              disabled={submitting}
            >
              Aplicar ajuste
            </Button>
          </>
        }
      >
        <AccountAdjustmentForm key={adjustFormKey} formId="account-adjustment-form" onSubmit={handleAdjust} />
      </Modal>
    </div>
  );
};

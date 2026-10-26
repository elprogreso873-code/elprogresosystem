import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Banknote, Truck } from 'lucide-react';
import { supplierService } from '../services/supplierService';
import { cashService } from '../services/cashService';
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
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { getErrorMessage } from '../utils/getErrorMessage';

const tipoLabel = { cargo: 'Compra a deber', pago: 'Pago', anulacion: 'Anulación' };
const tipoVariant = { cargo: 'empleado', pago: 'activo', anulacion: 'inactivo' };

export const SupplierDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canPay = hasPermission(PERMISSIONS.PROVEEDORES_PAGAR);
  const { methods: paymentMethods, defaultMethod } = usePaymentMethods({ activos: true });

  const [detail, setDetail] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [monto, setMonto] = useState(0);
  const [metodoPago, setMetodoPago] = useState('');
  const [pagaConCaja, setPagaConCaja] = useState(false);
  const [compraId, setCompraId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [cashSession, setCashSession] = useState(null);

  const load = useCallback(async () => {
    const data = await supplierService.getById(id);
    setDetail(data);
    return data;
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    supplierService
      .getById(id)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      });
    cashService
      .current()
      .then((sesion) => {
        if (!cancelled) setCashSession(sesion);
      })
      .catch(() => {
        if (!cancelled) setCashSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const metodoPagoValue =
    metodoPago ||
    (defaultMethod && !defaultMethod.genera_cargo_cc ? defaultMethod.codigo : 'efectivo');

  const listParams = useMemo(() => ({ id }), [id]);
  const {
    items: movements,
    pagination,
    loading,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit }) => {
      const { movements: data, pagination: pag } = await supplierService.movements(id, {
        page,
        limit,
      });
      return { data, pagination: pag };
    },
    params: listParams,
    defaultLimit: 15,
  });

  const proveedor = detail?.proveedor;
  const pendientes = detail?.compras_pendientes || [];
  const methods = (paymentMethods || []).filter((m) => !m.genera_cargo_cc);
  const methodOptions = methods.length
    ? methods.map((m) => ({ value: m.codigo, label: m.nombre }))
    : [{ value: 'efectivo', label: 'Efectivo' }];
  const missingCash = pagaConCaja && !cashSession;

  const handlePay = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await supplierService.pay(id, {
        monto: Number(monto),
        metodo_pago: metodoPagoValue,
        paga_con_caja: pagaConCaja,
        compra_id: compraId ? Number(compraId) : undefined,
        observaciones: observaciones.trim() || null,
      });
      setSuccess('Pago registrado');
      setPayOpen(false);
      setObservaciones('');
      await load();
      refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!proveedor && loading) return <Spinner />;
  if (!proveedor) return <Alert>{error || 'Proveedor no encontrado'}</Alert>;

  return (
    <div className="w-full max-w-4xl mx-auto pb-8">
      <header className="flex flex-wrap items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate('/proveedores')}
          className="p-2.5 rounded-xl hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-brand-600" />
            {proveedor.nombre}
          </h1>
          <p className="text-sm text-slate-500">
            {[proveedor.cuit, proveedor.telefono].filter(Boolean).join(' · ') || 'Sin contacto'}
          </p>
        </div>
        {canPay && proveedor.saldo > 0 && (
          <Button
            onClick={() => {
              setMonto(proveedor.saldo);
              setPayOpen(true);
            }}
          >
            <Banknote className="w-4 h-4" />
            Registrar pago
          </Button>
        )}
      </header>

      {error && <Alert className="mb-4">{error}</Alert>}
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      <Card className="mb-5 !p-5">
        <p className="text-xs text-slate-500">Saldo a pagar</p>
        <p className={`text-3xl font-bold tabular-nums ${proveedor.saldo > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
          {formatCurrency(proveedor.saldo)}
        </p>
        {proveedor.direccion && <p className="text-sm text-slate-500 mt-2">{proveedor.direccion}</p>}
      </Card>

      <Card title="Por qué se debe" className="mb-5">
        {pendientes.length === 0 ? (
          <p className="text-sm text-slate-500">No hay compras con saldo.</p>
        ) : (
          <div className="space-y-3">
            {pendientes.map((c) => (
              <Link
                key={c.id}
                to={`/compras/${c.id}`}
                className="flex justify-between gap-3 rounded-xl border border-slate-200 p-3 hover:border-brand-300"
              >
                <div>
                  <p className="font-medium text-slate-800">{c.numero}</p>
                  <p className="text-xs text-slate-500">{formatDate(c.fecha_compra)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{formatCurrency(c.saldo)}</p>
                  <p className="text-xs text-slate-500">de {formatCurrency(c.total)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card title="Historial">
        {loading && movements.length === 0 ? (
          <Spinner />
        ) : movements.length === 0 ? (
          <EmptyState title="Sin movimientos" />
        ) : (
          <>
            <div className="space-y-3">
              {movements.map((m) => (
                <div key={m.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex justify-between gap-3">
                    <Badge variant={tipoVariant[m.tipo]}>{tipoLabel[m.tipo] || m.tipo}</Badge>
                    <span className="text-xs text-slate-500">{formatDate(m.fecha)}</span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="font-bold tabular-nums">
                      {m.tipo === 'pago' || m.tipo === 'anulacion' ? '−' : '+'}
                      {formatCurrency(m.monto)}
                    </span>
                    <span className="text-sm text-slate-500">Saldo {formatCurrency(m.saldo_posterior)}</span>
                  </div>
                  {m.compra_numero && (
                    <Link to={`/compras/${m.compra_id}`} className="text-xs text-brand-700 hover:underline">
                      {m.compra_numero}
                    </Link>
                  )}
                  {m.observaciones && <p className="text-xs text-slate-500 mt-1">{m.observaciones}</p>}
                  <p className="text-xs text-slate-400 mt-1">
                    {m.usuario_nombre}
                    {m.metodo_pago_nombre ? ` · ${m.metodo_pago_nombre}` : ''}
                    {m.paga_con_caja ? ' · caja' : ''}
                  </p>
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
              itemLabel="movimientos"
            />
          </>
        )}
      </Card>

      <Modal
        isOpen={payOpen}
        onClose={() => setPayOpen(false)}
        title="Registrar pago"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setPayOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" form="supplier-pay-form" isLoading={submitting} disabled={missingCash}>
              Confirmar pago
            </Button>
          </>
        }
      >
        <form id="supplier-pay-form" onSubmit={handlePay} className="space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm">
            Saldo: <strong>{formatCurrency(proveedor.saldo)}</strong>
            <button
              type="button"
              className="ml-2 text-xs font-semibold text-brand-700 hover:underline"
              onClick={() => setMonto(proveedor.saldo)}
            >
              Pagar todo
            </button>
          </div>
          <CurrencyInput
            id="pago-monto"
            label="Monto"
            value={monto}
            max={proveedor.saldo}
            onChange={(v) => setMonto(v ?? 0)}
          />
          <Select
            id="pago-metodo"
            label="Método"
            value={metodoPagoValue}
            onChange={(e) => setMetodoPago(e.target.value)}
            options={methodOptions}
          />
          {pendientes.length > 0 && (
            <Select
              id="pago-compra"
              label="Imputar a una compra"
              placeholder="Automático (más antigua primero)"
              value={compraId}
              onChange={(e) => setCompraId(e.target.value)}
              options={[
                { value: '', label: 'Automático (más antigua primero)' },
                ...pendientes.map((c) => ({
                  value: String(c.id),
                  label: `${c.numero} · ${formatCurrency(c.saldo)}`,
                })),
              ]}
            />
          )}
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
            <input
              type="checkbox"
              className="mt-1 rounded border-slate-300 text-brand-600"
              checked={pagaConCaja}
              onChange={(e) => setPagaConCaja(e.target.checked)}
            />
            <span className="text-sm">
              <span className="font-medium text-slate-800">Descontar de la caja actual</span>
              <span className="block text-xs text-slate-500">
                Solo si el pago salió del efectivo del turno abierto.
              </span>
            </span>
          </label>
          {missingCash && (
            <Alert variant="info">
              No hay caja abierta.{' '}
              <Link to="/caja" className="underline font-medium">
                Abrir caja
              </Link>
            </Alert>
          )}
          <Input
            id="pago-obs"
            label="Observaciones"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};

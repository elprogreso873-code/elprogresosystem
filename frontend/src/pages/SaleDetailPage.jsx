import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  Receipt,
  Printer,
  RotateCcw,
  Wallet,
  Info,
  Plus,
} from 'lucide-react';
import { saleService } from '../services/saleService';
import { receiptService } from '../services/receiptService';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS, METODO_PAGO_LABELS } from '../constants/permissions';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { SaleReceiptPrint, printSaleReceipt } from '../components/commercial/SaleReceiptPrint';
import { SaleCancelModal } from '../components/commercial/SaleCancelModal';
import { SaleRegisteredBanner } from '../components/commercial/SaleRegisteredBanner';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { QuantityCell } from '../components/commercial/QuantityCell';
import { getErrorMessage } from '../utils/getErrorMessage';
import { buildSaleRedoState } from '../utils/saleRedo';
import { OnlineOnlyButton } from '../components/common/OnlineOnlyLink';
import { useConnection } from '../context/ConnectionContext';

export const SaleDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const canCancel = hasPermission(PERMISSIONS.VENTAS_ANULAR);
  const canCreate = hasPermission(PERMISSIONS.VENTAS_CREAR);
  const canReceipt = hasPermission(PERMISSIONS.COMPROBANTES_VER);
  const { isOffline } = useConnection();

  const [venta, setVenta] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(() => location.state?.message || '');
  const [justCreated, setJustCreated] = useState(() => Boolean(location.state?.justCreated));
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useLayoutEffect(() => {
    if (location.state?.justCreated || location.state?.message) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!success || justCreated) return;
    const t = setTimeout(() => setSuccess(''), 6000);
    return () => clearTimeout(t);
  }, [success, justCreated]);

  const load = () => {
    setLoading(true);
    saleService
      .getById(id)
      .then((v) => {
        setVenta(v);
        if (canReceipt) {
          receiptService.getByVenta(id).then(setReceiptData).catch(() => {});
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  const isInitialIdMount = useRef(true);

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (isInitialIdMount.current) {
      isInitialIdMount.current = false;
      return;
    }
    setJustCreated(false);
    setSuccess('');
  }, [id]);

  const handleCancelOnly = async () => {
    setCancelling(true);
    setError('');
    try {
      await saleService.cancel(id);
      setCancelModalOpen(false);
      setSuccess('Venta anulada correctamente. El stock fue restaurado.');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelAndRedo = async () => {
    if (!venta) return;
    if (isOffline) {
      setError('Sin conexión — no podés registrar una nueva venta hasta recuperar internet.');
      return;
    }
    setCancelling(true);
    setError('');
    try {
      await saleService.cancel(id);
      setCancelModalOpen(false);
      const redoState = buildSaleRedoState(venta);
      navigate('/ventas/nueva', {
        state: {
          ...redoState,
          message: `Venta ${venta.numero} anulada. Revise el carrito y registre la nueva venta.`,
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const handleRedo = () => {
    if (!venta) return;
    if (isOffline) {
      setError('Sin conexión — no podés registrar una nueva venta hasta recuperar internet.');
      return;
    }
    const redoState = buildSaleRedoState(venta);
    navigate('/ventas/nueva', {
      state: {
        ...redoState,
        message: 'Carrito cargado desde la venta anulada. Verifique stock y precios.',
      },
    });
  };

  const handleNewSale = () => navigate('/ventas/nueva');

  const handlePrint = async () => {
    try {
      const data = receiptData || (await receiptService.getByVenta(id));
      setReceiptData(data);
      setTimeout(printSaleReceipt, 150);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <Spinner />;
  if (!venta) return <Alert>{error || 'Venta no encontrada'}</Alert>;

  const showCancelHint =
    canCancel &&
    venta.estado === 'completada' &&
    !venta.puede_anular &&
    venta.caja_sesion_id;

  return (
    <div className={`space-y-6 ${justCreated && canCreate ? 'pb-24 sm:pb-6' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/ventas" className="p-2 rounded-lg hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="w-7 h-7 text-brand-600" />
              {venta.numero}
            </h1>
            <p className="text-slate-500 text-sm">{formatDate(venta.fecha_venta)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant={venta.estado === 'completada' ? 'activo' : 'inactivo'}>
            {venta.estado}
          </Badge>
          {canCreate && venta.estado === 'completada' && (
            <OnlineOnlyButton size="sm" onClick={handleNewSale} className="shadow-sm">
              <Plus className="w-4 h-4" /> Nueva venta
            </OnlineOnlyButton>
          )}
          {canReceipt && venta.estado === 'completada' && (
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4" /> Imprimir comprobante
            </Button>
          )}
          {canCreate && venta.estado === 'anulada' && (
            <OnlineOnlyButton variant="outline" size="sm" onClick={handleRedo}>
              <RotateCcw className="w-4 h-4" /> Rehacer venta
            </OnlineOnlyButton>
          )}
          {canCancel && venta.estado === 'completada' && venta.puede_anular && (
            <Button variant="danger" size="sm" onClick={() => setCancelModalOpen(true)}>
              <Ban className="w-4 h-4" /> Anular venta
            </Button>
          )}
        </div>
      </div>

      {justCreated && canCreate && (
        <SaleRegisteredBanner
          message={success}
          onNewSale={handleNewSale}
          onPrint={handlePrint}
          canPrint={canReceipt && venta.estado === 'completada'}
          onDismiss={() => {
            setJustCreated(false);
            setSuccess('');
          }}
        />
      )}
      {success && !justCreated && <Alert variant="success">{success}</Alert>}
      {error && <Alert>{error}</Alert>}

      {showCancelHint && (
        <Alert variant="info">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {venta.caja_sesion_estado === 'cerrada'
                ? 'Esta venta pertenece a un turno de caja cerrado y no puede anularse.'
                : 'Solo puede anular ventas registradas en su turno de caja abierto actualmente.'}
            </span>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Productos">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 text-left font-medium">Producto</th>
                  <th className="py-2 text-right font-medium min-w-[8.5rem]">Cantidad</th>
                  <th className="py-2 text-right font-medium">Precio</th>
                  <th className="py-2 text-right font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {venta.detalle?.map((line) => (
                  <tr key={line.id} className="border-b border-slate-100">
                    <td className="py-3 pr-3">
                      <p className="font-medium text-slate-800">{line.producto_nombre}</p>
                      <p className="text-xs text-slate-400">{line.producto_codigo}</p>
                    </td>
                    <QuantityCell line={line} />
                    <td className="py-3 text-right pl-3">{formatCurrency(line.precio_unitario)}</td>
                    <td className="py-3 text-right font-medium pl-2">
                      {formatCurrency(line.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Resumen">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Cliente</dt>
              <dd className="font-medium text-slate-800">
                {venta.cliente_nombre || 'Consumidor final'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Vendedor</dt>
              <dd className="font-medium">{venta.usuario_nombre}</dd>
            </div>
            {venta.caja_sesion_id && (
              <div>
                <dt className="text-slate-500 flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" /> Turno de caja
                </dt>
                <dd className="font-medium">
                  #{venta.caja_sesion_id}
                  <Badge
                    variant={venta.caja_sesion_estado === 'abierta' ? 'activo' : 'inactivo'}
                    className="ml-2"
                  >
                    {venta.caja_sesion_estado || '—'}
                  </Badge>
                </dd>
                {venta.caja_fecha_apertura && (
                  <dd className="text-xs text-slate-500 mt-0.5">
                    Apertura: {formatDate(venta.caja_fecha_apertura)}
                  </dd>
                )}
              </div>
            )}
            {venta.comprobante_numero && (
              <div>
                <dt className="text-slate-500">Comprobante</dt>
                <dd className="font-mono font-medium">{venta.comprobante_numero}</dd>
              </div>
            )}
            <div>
              <dt className="text-slate-500">Pago</dt>
              <dd className="font-medium">
                {venta.metodo_pago_nombre || METODO_PAGO_LABELS[venta.metodo_pago] || venta.metodo_pago}
              </dd>
              {venta.pagos?.length > 1 && (
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {venta.pagos.map((pago) => (
                    <li key={pago.id} className="flex justify-between gap-3">
                      <span>{pago.metodo_pago_nombre}</span>
                      <span className="tabular-nums font-medium">{formatCurrency(pago.monto)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {(venta.pagos?.some((p) => p.metodo_pago === 'cuenta_corriente') ||
              venta.metodo_pago === 'cuenta_corriente') &&
              venta.cliente_id && (
              <div>
                <dt className="text-slate-500">Cuenta corriente</dt>
                <dd>
                  <Link
                    to={`/clientes/cuenta-corriente/${venta.cliente_id}`}
                    className="text-brand-700 hover:underline font-medium"
                  >
                    Ver estado de cuenta
                  </Link>
                </dd>
              </div>
            )}
            {venta.monto_recibido != null && (
              <>
                <div>
                  <dt className="text-slate-500">Recibido</dt>
                  <dd>{formatCurrency(venta.monto_recibido)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Vuelto</dt>
                  <dd>{formatCurrency(venta.vuelto ?? 0)}</dd>
                </div>
              </>
            )}
            {venta.observaciones && (
              <div>
                <dt className="text-slate-500">Observaciones</dt>
                <dd>{venta.observaciones}</dd>
              </div>
            )}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatCurrency(venta.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Descuento</span>
                <span>-{formatCurrency(venta.descuento)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2">
                <span>Total</span>
                <span className="text-brand-700">{formatCurrency(venta.total)}</span>
              </div>
            </div>
          </dl>
        </Card>
      </div>

      {receiptData && <SaleReceiptPrint data={receiptData} />}

      <SaleCancelModal
        isOpen={cancelModalOpen}
        onClose={() => !cancelling && setCancelModalOpen(false)}
        sale={venta}
        onCancelOnly={handleCancelOnly}
        onCancelAndRedo={handleCancelAndRedo}
        loading={cancelling}
      />

      {justCreated && canCreate && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] sm:hidden">
          <Button size="lg" className="w-full min-h-12 shadow-md" onClick={handleNewSale}>
            <Plus className="w-5 h-5" />
            Registrar otra venta
          </Button>
        </div>
      )}
    </div>
  );
};

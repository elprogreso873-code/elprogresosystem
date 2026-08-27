import { useState, useEffect, useLayoutEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Ban,
  ClipboardList,
  Printer,
  Download,
  Plus,
  ShoppingCart,
} from 'lucide-react';
import { quoteService } from '../services/quoteService';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { QuotePrint, printQuote } from '../components/commercial/QuotePrint';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { QuantityCell } from '../components/commercial/QuantityCell';
import { getErrorMessage } from '../utils/getErrorMessage';
import { downloadQuotePdf } from '../utils/quotePdf';
import { shareQuoteViaWhatsApp } from '../utils/shareQuoteWhatsApp';
import { buildQuoteToSaleState } from '../utils/quoteToSale';
import { OnlineOnlyButton } from '../components/common/OnlineOnlyLink';
import { useConnection } from '../context/ConnectionContext';

const quoteEstadoLabel = {
  vigente: 'Vigente',
  anulado: 'Anulado',
  convertido: 'Convertido',
};

const quoteEstadoVariant = (estado) => {
  if (estado === 'vigente') return 'activo';
  if (estado === 'convertido') return 'admin';
  return 'inactivo';
};

export const QuoteDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const { isOffline } = useConnection();
  const canCancel = hasPermission(PERMISSIONS.PRESUPUESTOS_ANULAR);
  const canCreate = hasPermission(PERMISSIONS.PRESUPUESTOS_CREAR);
  const canConvertQuote = hasPermission(
    PERMISSIONS.PRESUPUESTOS_CONVERTIR,
    PERMISSIONS.VENTAS_CREAR
  );

  const [presupuesto, setPresupuesto] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(() => location.state?.message || '');
  const [justCreated, setJustCreated] = useState(() => Boolean(location.state?.justCreated));
  const [actionLoading, setActionLoading] = useState(false);

  useLayoutEffect(() => {
    if (location.state?.justCreated || location.state?.message) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, navigate]);

  const load = async () => {
    setLoading(true);
    try {
      const [quote, print] = await Promise.all([
        quoteService.getById(id),
        quoteService.getPrintData(id),
      ]);
      setPresupuesto(quote);
      setPrintData(print);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
      setPresupuesto(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!success || justCreated) return;
    const t = setTimeout(() => setSuccess(''), 6000);
    return () => clearTimeout(t);
  }, [success, justCreated]);

  const handleCancel = async () => {
    if (!window.confirm(`¿Anular el presupuesto ${presupuesto.numero}?`)) return;
    setActionLoading(true);
    setError('');
    try {
      await quoteService.cancel(id);
      setSuccess('Presupuesto anulado correctamente');
      setJustCreated(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    if (!printData) return;
    setTimeout(printQuote, 150);
  };

  const handleDownloadPdf = async () => {
    if (!printData) return;
    setActionLoading(true);
    try {
      await downloadQuotePdf(printData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleWhatsApp = async () => {
    if (!presupuesto) return;
    setActionLoading(true);
    setError('');
    try {
      await shareQuoteViaWhatsApp(presupuesto, printData);
      setSuccess(
        'WhatsApp abierto en una nueva pestaña. El PDF se descargó para adjuntarlo al mensaje.'
      );
      setJustCreated(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToSale = () => {
    if (!presupuesto) return;
    if (isOffline) {
      setError('Sin conexión — no podés convertir el presupuesto hasta recuperar internet.');
      return;
    }
    const state = buildQuoteToSaleState(presupuesto);
    if (!state) {
      setError('El presupuesto no tiene productos para convertir.');
      return;
    }
    navigate('/ventas/nueva', { state });
  };

  if (loading) return <Spinner />;
  if (!presupuesto) return <Alert>{error || 'Presupuesto no encontrado'}</Alert>;

  const showConvert = canConvertQuote && presupuesto.puede_convertir;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/presupuestos" className="p-2 rounded-lg hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-7 h-7 text-brand-600" />
              {presupuesto.numero}
            </h1>
            <p className="text-slate-500 text-sm">{formatDate(presupuesto.fecha_presupuesto)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={quoteEstadoVariant(presupuesto.estado)}>
            {quoteEstadoLabel[presupuesto.estado] || presupuesto.estado}
          </Badge>
          {showConvert && (
            <OnlineOnlyButton size="sm" onClick={handleConvertToSale} className="shadow-sm">
              <ShoppingCart className="w-4 h-4" /> Convertir a venta
            </OnlineOnlyButton>
          )}
          {presupuesto.estado === 'convertido' && presupuesto.venta_id && (
            <Link to={`/ventas/${presupuesto.venta_id}`}>
              <Button variant="outline" size="sm">
                Ver venta {presupuesto.venta_numero || `#${presupuesto.venta_id}`}
              </Button>
            </Link>
          )}
          {canCreate && presupuesto.estado === 'vigente' && (
            <OnlineOnlyButton size="sm" onClick={() => navigate('/presupuestos/nuevo')}>
              <Plus className="w-4 h-4" /> Nuevo
            </OnlineOnlyButton>
          )}
          <Button variant="outline" size="sm" onClick={handlePrint} disabled={!printData}>
            <Printer className="w-4 h-4" /> Imprimir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={!printData}
            isLoading={actionLoading}
          >
            <Download className="w-4 h-4" /> PDF
          </Button>
          {presupuesto.estado === 'vigente' && presupuesto.cliente_id && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleWhatsApp}
              isLoading={actionLoading}
            >
              <WhatsAppIcon className="w-4 h-4" /> WhatsApp
            </Button>
          )}
          {canCancel && presupuesto.puede_anular && (
            <Button variant="danger" size="sm" onClick={handleCancel} isLoading={actionLoading}>
              <Ban className="w-4 h-4" /> Anular
            </Button>
          )}
        </div>
      </div>

      {justCreated && success && (
        <Alert variant="success">
          Presupuesto registrado: {success}
        </Alert>
      )}
      {success && !justCreated && <Alert variant="success">{success}</Alert>}
      {error && <Alert>{error}</Alert>}

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
                {presupuesto.detalle?.map((line) => (
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
                {presupuesto.cliente_nombre || 'Consumidor final'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Vendedor</dt>
              <dd className="font-medium">{presupuesto.usuario_nombre}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Válido hasta</dt>
              <dd className="font-medium">
                {presupuesto.validez_hasta ? formatDate(presupuesto.validez_hasta) : '—'}
              </dd>
            </div>
            {presupuesto.estado === 'convertido' && presupuesto.venta_id && (
              <div>
                <dt className="text-slate-500">Venta vinculada</dt>
                <dd>
                  <Link
                    to={`/ventas/${presupuesto.venta_id}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {presupuesto.venta_numero || `Venta #${presupuesto.venta_id}`}
                  </Link>
                </dd>
              </div>
            )}
            {presupuesto.observaciones && (
              <div>
                <dt className="text-slate-500">Observaciones</dt>
                <dd className="text-slate-700 whitespace-pre-wrap">{presupuesto.observaciones}</dd>
              </div>
            )}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatCurrency(presupuesto.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Descuento</span>
                <span>-{formatCurrency(presupuesto.descuento)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-brand-700">
                <span>Total</span>
                <span>{formatCurrency(presupuesto.total)}</span>
              </div>
            </div>
          </dl>
        </Card>
      </div>

      <QuotePrint data={printData} />
    </div>
  );
};

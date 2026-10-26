import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Ban, Wallet } from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { getErrorMessage } from '../utils/getErrorMessage';

const pagoLabel = { pagada: 'Pagada', parcial: 'Parcial', pendiente: 'Pendiente' };
const pagoVariant = { pagada: 'activo', parcial: 'admin', pendiente: 'empleado' };

export const PurchaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = usePermissions();
  const canCancel = hasPermission(PERMISSIONS.COMPRAS_ANULAR);

  const [compra, setCompra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(() => location.state?.message || '');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    purchaseService
      .getById(id)
      .then((data) => {
        if (!cancelled) {
          setCompra(data);
          setError('');
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 8000);
    return () => clearTimeout(t);
  }, [success]);

  const handleCancel = async () => {
    if (!window.confirm(`¿Anular ${compra.numero}? Se revierte el stock y el saldo.`)) return;
    setCancelling(true);
    try {
      const updated = await purchaseService.cancel(id);
      setCompra(updated);
      setSuccess('Compra anulada. El stock se revirtió.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Spinner />;
  if (!compra) return <Alert>{error || 'Compra no encontrada'}</Alert>;

  return (
    <div className="w-full max-w-4xl mx-auto pb-8">
      <header className="flex flex-wrap items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate('/compras')}
          className="p-2.5 rounded-xl hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800">{compra.numero}</h1>
          <p className="text-sm text-slate-500">{formatDate(compra.fecha_compra)}</p>
        </div>
        <Badge variant={compra.estado === 'anulada' ? 'inactivo' : 'activo'}>{compra.estado}</Badge>
        {compra.estado !== 'anulada' && (
          <Badge variant={pagoVariant[compra.estado_pago]}>{pagoLabel[compra.estado_pago]}</Badge>
        )}
      </header>

      {error && <Alert className="mb-4">{error}</Alert>}
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <Card className="!p-4">
          <p className="text-xs text-slate-500">Proveedor</p>
          <Link
            to={`/proveedores/${compra.proveedor_id}`}
            className="font-semibold text-brand-700 hover:underline"
          >
            {compra.proveedor_nombre}
          </Link>
          <p className="text-xs text-slate-500 mt-2">Registró {compra.usuario_nombre}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-slate-500">Totales</p>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(compra.total)}</p>
          {compra.total_manual && (
            <p className="text-xs text-slate-500">Total indicado a mano · calc. {formatCurrency(compra.subtotal)}</p>
          )}
          <p className="text-sm mt-1">
            Pagado {formatCurrency(compra.monto_pagado)} · saldo {formatCurrency(compra.saldo)}
          </p>
          {compra.paga_con_caja && (
            <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Descontada de caja
            </p>
          )}
        </Card>
      </div>

      <Card title="Productos" className="mb-5">
        <div className="space-y-3">
          {compra.items?.map((item) => (
            <div key={item.id} className="flex justify-between gap-3 border-b border-slate-100 pb-3 last:border-0">
              <div>
                <p className="font-medium text-slate-800">{item.producto_nombre}</p>
                {item.producto_codigo && (
                  <p className="text-xs font-mono text-slate-500">{item.producto_codigo}</p>
                )}
                <p className="text-xs text-slate-500">
                  {formatNumber(item.cantidad, 3)} × {formatCurrency(item.precio_costo)}
                  {item.actualizar_precios ? ' · precios actualizados' : ''}
                </p>
              </div>
              <p className="font-semibold tabular-nums">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>
      </Card>

      {compra.pagos?.length > 0 && (
        <Card title="Pagos" className="mb-5">
          <div className="space-y-2">
            {compra.pagos.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">
                    {p.metodo_pago_nombre || p.metodo_pago || 'Pago'}
                    {p.es_inicial ? ' · inicial' : ''}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(p.fecha)} · {p.usuario_nombre}
                    {p.paga_con_caja ? ' · caja' : ''}
                  </p>
                </div>
                <p className="font-semibold tabular-nums">{formatCurrency(p.monto)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {compra.observaciones && (
        <Card title="Observaciones" className="mb-5">
          <p className="text-sm text-slate-700">{compra.observaciones}</p>
        </Card>
      )}

      {canCancel && compra.puede_anular && (
        <Button variant="danger" onClick={handleCancel} isLoading={cancelling}>
          <Ban className="w-4 h-4" />
          Anular compra
        </Button>
      )}
    </div>
  );
};

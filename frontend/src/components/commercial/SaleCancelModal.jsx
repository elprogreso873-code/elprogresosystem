import { AlertTriangle, Ban, RotateCcw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

export const SaleCancelModal = ({
  isOpen,
  onClose,
  sale,
  onCancelOnly,
  onCancelAndRedo,
  loading = false,
}) => {
  if (!sale) return null;

  const isCashSessionClosed =
    sale.caja_sesion_id && sale.caja_sesion_estado && sale.caja_sesion_estado !== 'abierta';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Anular venta"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Volver
          </Button>
          <Button
            variant="danger"
            onClick={onCancelOnly}
            disabled={loading}
            isLoading={loading}
          >
            <Ban className="w-4 h-4" />
            Anular solamente
          </Button>
          <Button onClick={onCancelAndRedo} disabled={loading} isLoading={loading}>
            <RotateCcw className="w-4 h-4" />
            Anular y rehacer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-medium">Esta acción no se puede deshacer</p>
            <p className="mt-1 text-amber-800">
              Se restaurará el stock de los productos. Si la venta afectó caja o cuenta corriente,
              se revertirán esos movimientos.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm rounded-xl border border-slate-200 p-4 bg-slate-50/50">
          <div>
            <dt className="text-slate-500">Venta</dt>
            <dd className="font-mono font-semibold text-slate-800">{sale.numero}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Total</dt>
            <dd className="font-bold text-slate-800">{formatCurrency(sale.total)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Cliente</dt>
            <dd className="font-medium">{sale.cliente_nombre || 'Consumidor final'}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Fecha</dt>
            <dd>{formatDate(sale.fecha_venta)}</dd>
          </div>
        </dl>

        {isCashSessionClosed && (
          <p className="text-sm text-red-600">
            Esta venta pertenece a un turno de caja cerrado y no puede anularse.
          </p>
        )}

        <div className="text-sm text-slate-600 space-y-2">
          <p>
            <strong>Anular solamente:</strong> cancela la venta y vuelve al listado o detalle.
          </p>
          <p>
            <strong>Anular y rehacer:</strong> cancela la venta y abre una nueva con los mismos
            productos para volver a cobrar (verifique stock y precios actuales).
          </p>
        </div>
      </div>
    </Modal>
  );
};

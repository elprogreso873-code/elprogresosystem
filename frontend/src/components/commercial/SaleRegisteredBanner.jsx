import { Link } from 'react-router-dom';
import { CheckCircle2, Plus, Printer, List, X } from 'lucide-react';
import { Button } from '../ui/Button';

export const SaleRegisteredBanner = ({
  message,
  onNewSale,
  onPrint,
  canPrint = false,
  onDismiss,
}) => (
  <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-brand-50/40 shadow-sm">
    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
    <div className="relative p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
          <CheckCircle2 className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0 pr-6">
          <p className="font-semibold text-emerald-900">¡Venta registrada!</p>
          {message && <p className="text-sm text-emerald-800/90 mt-0.5">{message}</p>}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-emerald-700/70 hover:bg-emerald-100/80 hover:text-emerald-900"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-4">
        <Button size="lg" className="w-full sm:w-auto min-h-11 shadow-md" onClick={onNewSale}>
          <Plus className="w-5 h-5" />
          Registrar otra venta
        </Button>
        {canPrint && (
          <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={onPrint}>
            <Printer className="w-4 h-4" />
            Imprimir comprobante
          </Button>
        )}
        <Link to="/ventas" className="w-full sm:w-auto">
          <Button variant="ghost" size="lg" className="w-full sm:w-auto">
            <List className="w-4 h-4" />
            Ver listado
          </Button>
        </Link>
      </div>
    </div>
  </div>
);

import { CreditCard } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../utils/formatCurrency';

export const SaleMobileCheckoutBar = ({
  cartCount,
  total,
  submitting,
  disabled,
  paymentLabel,
  onRegisterPayment,
}) => (
  <div
    className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(15,23,42,0.12)] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
  >
    <div className="page-padding-x pt-3 pb-1 max-w-7xl mx-auto">
      <div className="flex items-end justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums truncate">
            {formatCurrency(total)}
          </p>
          {cartCount > 0 && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {cartCount} producto{cartCount !== 1 ? 's' : ''}
              {paymentLabel ? ` · ${paymentLabel}` : ''}
            </p>
          )}
        </div>
        <Button
          size="lg"
          className="shrink-0 min-h-12 px-4 shadow-lg"
          onClick={onRegisterPayment}
          isLoading={submitting}
          disabled={disabled && cartCount === 0}
        >
          <CreditCard className="w-5 h-5" />
          Registrar pago
        </Button>
      </div>
    </div>
  </div>
);

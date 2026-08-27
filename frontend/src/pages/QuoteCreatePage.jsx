import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, ClipboardList } from 'lucide-react';
import { quoteService } from '../services/quoteService';
import { clientService } from '../services/clientService';
import { productService } from '../services/productService';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { Card } from '../components/ui/Card';
import { SearchInput } from '../components/ui/SearchInput';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { SaleCartLine, applyModoToCartLine } from '../components/commercial/SaleCartLine';
import {
  buildCartLine,
  cartLineKey,
  MODOS_VENTA,
} from '../utils/productPricing';
import { QuoteCheckoutModal } from '../components/commercial/QuoteCheckoutModal';
import { ProductSearchCard } from '../components/catalog/ProductSearchCard';
import { useDebounce } from '../hooks/useDebounce';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';
import { getErrorMessage } from '../utils/getErrorMessage';
import { useConnection } from '../context/ConnectionContext';
import { OnlineOnlyButton } from '../components/common/OnlineOnlyLink';
import { getStockAddWarning } from '../utils/stockWarnings';

const MIN_SEARCH_CHARS = 2;

export const QuoteCreatePage = () => {
  const navigate = useNavigate();
  const { isOffline } = useConnection();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.PRESUPUESTOS_CREAR);

  const [clients, setClients] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [descuentoGlobal, setDescuentoGlobal] = useState(0);
  const [validezDias, setValidezDias] = useState(15);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [stockWarning, setStockWarning] = useState('');
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const cartSectionRef = useRef(null);

  useEffect(() => {
    clientService
      .listActive()
      .then(setClients)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const term = debouncedProductSearch.trim();
    if (term.length < MIN_SEARCH_CHARS) {
      setSearchResults([]);
      setSearchError('');
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    setSearchError('');

    productService
      .quickSearch(term, 25)
      .then((items) => {
        if (!cancelled) setSearchResults(items);
      })
      .catch((err) => {
        if (!cancelled) {
          setSearchError(getErrorMessage(err));
          setSearchResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedProductSearch]);

  const scrollToCart = () => {
    requestAnimationFrame(() => {
      cartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const addToCart = (product, modoVenta = MODOS_VENTA.SUELTO) => {
    setError('');
    const key = cartLineKey(product.id, modoVenta);
    const existingQty = cart.find((i) => i.lineKey === key)?.cantidad ?? 0;
    const draftLine = buildCartLine(product, modoVenta);
    const newQty = existingQty + 1;
    const warning = getStockAddWarning({ ...draftLine, cantidad: newQty }, newQty);
    if (warning) setStockWarning(warning);

    const wasEmpty = cart.length === 0;
    setCart((prev) => {
      const existing = prev.find((i) => i.lineKey === key);
      if (existing) {
        return prev.map((i) =>
          i.lineKey === key ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, draftLine];
    });
    if (wasEmpty && typeof window !== 'undefined' && window.matchMedia('(max-width: 1279px)').matches) {
      scrollToCart();
    }
  };

  const normalizeCartNumeric = (field, value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const n = Number(value);
    if (!Number.isFinite(n)) return field === 'cantidad' ? 1 : 0;
    return n;
  };

  const updateCartItem = (lineKey, field, value) => {
    setCart((prev) => {
      const next = prev.map((i) =>
        i.lineKey === lineKey
          ? {
              ...i,
              [field]:
                field === 'cantidad' || field === 'precio_unitario' || field === 'descuento'
                  ? normalizeCartNumeric(field, value)
                  : value,
            }
          : i
      );
      if (field === 'cantidad') {
        const item = next.find((i) => i.lineKey === lineKey);
        if (item) {
          const warning = getStockAddWarning(item, item.cantidad);
          setStockWarning(warning || '');
        }
      }
      return next;
    });
  };

  const changeCartModo = (lineKey, newModo) => {
    setCart((prev) => {
      const current = prev.find((i) => i.lineKey === lineKey);
      if (!current || current.modo_venta === newModo) return prev;

      const updated = applyModoToCartLine(current, newModo);
      const newKey = updated.lineKey;
      const withoutCurrent = prev.filter((i) => i.lineKey !== lineKey);
      const existingTarget = withoutCurrent.find((i) => i.lineKey === newKey);

      if (existingTarget) {
        return withoutCurrent.map((i) =>
          i.lineKey === newKey ? { ...i, cantidad: i.cantidad + updated.cantidad } : i
        );
      }

      return [...withoutCurrent, updated];
    });
  };

  const removeFromCart = (lineKey) => {
    setCart((prev) => prev.filter((i) => i.lineKey !== lineKey));
  };

  const subtotal = cart.reduce(
    (acc, i) => acc + i.precio_unitario * i.cantidad - (i.descuento || 0),
    0
  );
  const total = Math.max(0, subtotal - descuentoGlobal);

  const openCheckout = () => {
    if (!cart.length) {
      setError('Agregue al menos un producto al presupuesto');
      return;
    }
    setError('');
    setCheckoutOpen(true);
  };

  const handleSubmit = async () => {
    if (!canCreate || isOffline) return;
    if (!cart.length) {
      setError('Agregue al menos un producto');
      return;
    }
    if (descuentoGlobal > subtotal) {
      setError('El descuento no puede superar el subtotal');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const presupuesto = await quoteService.create({
        cliente_id: clienteId ? Number(clienteId) : null,
        observaciones: observaciones.trim() || null,
        descuento: descuentoGlobal,
        validez_dias: validezDias,
        items: cart.map((i) => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          modo_venta: i.modo_venta ?? MODOS_VENTA.SUELTO,
          precio_unitario: i.precio_unitario,
          descuento: i.descuento ?? 0,
        })),
      });
      navigate(`/presupuestos/${presupuesto.id}`, {
        state: {
          justCreated: true,
          message: `${presupuesto.numero} · ${formatCurrency(presupuesto.total)}`,
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="pb-28 xl:pb-8 w-full max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center gap-3 mb-5 sm:mb-6">
        <button
          type="button"
          onClick={() => navigate('/presupuestos')}
          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 touch-manipulation shrink-0"
          aria-label="Volver a presupuestos"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 sm:w-7 sm:h-7 text-brand-600 shrink-0" />
            Nuevo presupuesto
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Cotización sin afectar stock ni caja
          </p>
        </div>
        {cart.length > 0 && (
          <OnlineOnlyButton
            size="lg"
            className="hidden xl:inline-flex min-h-11 shadow-md"
            onClick={openCheckout}
          >
            <FileText className="w-5 h-5" />
            Confirmar presupuesto
          </OnlineOnlyButton>
        )}
      </header>

      {isOffline && (
        <Alert className="mb-4">
          Sin conexión — el presupuesto no se puede registrar hasta que vuelva internet.
        </Alert>
      )}
      {error && <Alert className="mb-4">{error}</Alert>}
      {stockWarning && (
        <Alert variant="warning" className="mb-4">
          {stockWarning} (informativo — no reserva stock)
        </Alert>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-6">
        <Card title="Buscar producto" className="!p-4 sm:!p-6 h-fit">
          <SearchInput
            id="buscar-prod-presupuesto"
            label="Código o nombre"
            placeholder="Ej: ga, 001, nombre…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            hint={`Mínimo ${MIN_SEARCH_CHARS} caracteres`}
            className="mb-3"
          />
          {searchError && <p className="text-sm text-red-600 mb-2">{searchError}</p>}
          <div
            className="space-y-2 overflow-y-auto overscroll-contain -mx-1 px-1"
            style={{ maxHeight: 'min(52vh, 420px)' }}
          >
            {searchLoading && (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            )}
            {!searchLoading && productSearch.trim().length < MIN_SEARCH_CHARS && (
              <p className="text-sm text-slate-500 text-center py-12 px-2">
                Escriba para buscar en el catálogo
              </p>
            )}
            {!searchLoading &&
              productSearch.trim().length >= MIN_SEARCH_CHARS &&
              searchResults.length === 0 &&
              !searchError && (
                <p className="text-sm text-slate-500 text-center py-12">
                  Sin resultados para &quot;{productSearch.trim()}&quot;
                </p>
              )}
            {!searchLoading &&
              searchResults.map((p) => {
                const stock = Number(p.stock ?? 0);
                return (
                  <ProductSearchCard
                    key={p.id}
                    product={p}
                    onClick={() => addToCart(p)}
                    onAddWithMode={(product, modo) => addToCart(product, modo)}
                    footer={
                      <p
                        className={`text-xs mt-1.5 font-medium ${
                          stock <= 0
                            ? 'text-red-600'
                            : p.stock_bajo
                              ? 'text-amber-700'
                              : 'text-slate-500'
                        }`}
                      >
                        Stock {formatNumber(stock, 2)} (referencia)
                      </p>
                    }
                  />
                );
              })}
          </div>
        </Card>

        <div ref={cartSectionRef} className="scroll-mt-4 flex flex-col min-h-0">
          <Card
            title="Carrito"
            subtitle={cart.length ? `${cart.length} producto${cart.length !== 1 ? 's' : ''}` : 'Vacío'}
            className="!p-4 sm:!p-6 flex-1 flex flex-col"
            action={
              cart.length > 0 ? (
                <span className="text-sm font-bold text-brand-700 tabular-nums">
                  {formatCurrency(subtotal)}
                </span>
              ) : null
            }
          >
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80">
                <ClipboardList className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">Sin productos</p>
                <p className="text-sm text-slate-500 mt-1 text-center">
                  Busque y toque un producto para agregarlo
                </p>
              </div>
            ) : (
              <>
                <div
                  className="space-y-3 flex-1 overflow-y-auto overscroll-contain -mx-1 px-1 mb-4"
                  style={{ maxHeight: 'min(52vh, 420px)' }}
                >
                  {cart.map((item) => (
                    <SaleCartLine
                      key={item.lineKey}
                      item={item}
                      onUpdate={updateCartItem}
                      onRemove={removeFromCart}
                      onModoChange={changeCartModo}
                    />
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-200 space-y-3 shrink-0">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Subtotal</span>
                    <span className="font-medium tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">Total estimado</span>
                    <span className="text-xl font-bold text-brand-700 tabular-nums">
                      {formatCurrency(total)}
                    </span>
                  </div>
                  <OnlineOnlyButton
                    size="lg"
                    className="w-full min-h-12 shadow-md hidden xl:flex"
                    onClick={openCheckout}
                  >
                    <FileText className="w-5 h-5" />
                    Confirmar presupuesto
                  </OnlineOnlyButton>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      <QuoteCheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        clients={clients}
        clienteId={clienteId}
        onClienteChange={setClienteId}
        onClientSelect={setClienteId}
        observaciones={observaciones}
        onObservacionesChange={setObservaciones}
        descuentoGlobal={descuentoGlobal}
        onDescuentoChange={setDescuentoGlobal}
        validezDias={validezDias}
        onValidezDiasChange={setValidezDias}
        total={total}
        subtotal={subtotal}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitDisabled={!canCreate || isOffline || !cart.length}
      />

      {cart.length > 0 && (
        <div className="xl:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(15,23,42,0.12)] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <div className="page-padding-x pt-3 pb-1 max-w-7xl mx-auto">
            <div className="flex items-end justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums truncate">
                  {formatCurrency(total)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {cart.length} producto{cart.length !== 1 ? 's' : ''}
                </p>
              </div>
              <OnlineOnlyButton
                size="lg"
                className="shrink-0 min-h-12 px-4 shadow-lg"
                onClick={openCheckout}
                isLoading={submitting}
              >
                <FileText className="w-5 h-5" />
                Confirmar
              </OnlineOnlyButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

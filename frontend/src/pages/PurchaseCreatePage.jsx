import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Plus, Truck } from 'lucide-react';
import { purchaseService } from '../services/purchaseService';
import { supplierService } from '../services/supplierService';
import { productService } from '../services/productService';
import { cashService } from '../services/cashService';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { Alert } from '../components/ui/Alert';
import { Spinner } from '../components/ui/Spinner';
import { Select } from '../components/ui/Select';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { ProductSearchCard } from '../components/catalog/ProductSearchCard';
import { PurchaseCartLine } from '../components/purchases/PurchaseCartLine';
import { PurchaseCheckoutModal } from '../components/purchases/PurchaseCheckoutModal';
import { ProductQuickCreateModal } from '../components/purchases/ProductQuickCreateModal';
import { QuickSupplierCreateModal } from '../components/purchases/QuickSupplierCreateModal';
import { useDebounce } from '../hooks/useDebounce';
import { useBarcodeProductSearch } from '../hooks/useBarcodeProductSearch';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';
import { getErrorMessage } from '../utils/getErrorMessage';
import { useConnection } from '../context/ConnectionContext';
import { OnlineOnlyButton } from '../components/common/OnlineOnlyLink';

const MIN_SEARCH_CHARS = 2;
const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const PurchaseCreatePage = () => {
  const navigate = useNavigate();
  const { isOffline } = useConnection();
  const { hasPermission } = usePermissions();
  const canCreateProduct = hasPermission(PERMISSIONS.PRODUCTOS_CREAR);
  const canCreateSupplier = hasPermission(PERMISSIONS.PROVEEDORES_CREAR);
  const { methods: paymentMethods, defaultMethod } = usePaymentMethods({ activos: true });

  const [suppliers, setSuppliers] = useState([]);
  const [proveedorId, setProveedorId] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [lastAddedKey, setLastAddedKey] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [totalManual, setTotalManual] = useState(null);
  const [editingTotal, setEditingTotal] = useState(false);
  const [pagada, setPagada] = useState(false);
  const [montoPagado, setMontoPagado] = useState(0);
  const [metodoPago, setMetodoPago] = useState('');
  const [pagaConCaja, setPagaConCaja] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [cashSession, setCashSession] = useState(null);
  const [cashLoading, setCashLoading] = useState(true);
  const debouncedProductSearch = useDebounce(productSearch, 300);
  const cartRef = useRef([]);

  const computedTotal = roundMoney(
    cart.reduce((acc, i) => acc + Number(i.precio_costo || 0) * Number(i.cantidad || 0), 0)
  );
  const total = totalManual != null ? roundMoney(totalManual) : computedTotal;
  const selectedSupplier = suppliers.find((s) => String(s.id) === String(proveedorId));

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    if (!lastAddedKey) return;
    const t = setTimeout(() => setLastAddedKey(''), 1200);
    return () => clearTimeout(t);
  }, [lastAddedKey]);

  const addToCart = useCallback((product) => {
    setError('');
    const key = String(product.id);
    const existing = cartRef.current.find((i) => i.lineKey === key);
    if (existing) {
      const next = cartRef.current.map((i) =>
        i.lineKey === key ? { ...i, cantidad: Number(i.cantidad) + 1 } : i
      );
      cartRef.current = next;
      setCart(next);
    } else {
      const line = {
        lineKey: key,
        producto_id: product.id,
        nombre: product.nombre,
        codigo: product.codigo || '',
        imagen_url: product.imagen_url,
        cantidad: 1,
        precio_costo: Number(product.precio_costo ?? 0),
        precio_venta: Number(product.precio_venta ?? 0),
        actualizar_precios: true,
      };
      const next = [...cartRef.current, line];
      cartRef.current = next;
      setCart(next);
    }
    setLastAddedKey(key);
  }, []);

  const { inputRef, onKeyDown, onChange, scanBusy } = useBarcodeProductSearch({
    productSearch,
    setProductSearch,
    setSearchResults,
    setSearchError,
    setSearchLoading,
    addToCart,
    enabled: !checkoutOpen && !productModalOpen,
  });

  useEffect(() => {
    supplierService
      .listActive()
      .then(setSuppliers)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    cashService
      .current()
      .then((sesion) => {
        if (!cancelled) setCashSession(sesion);
      })
      .catch(() => {
        if (!cancelled) setCashSession(null);
      })
      .finally(() => {
        if (!cancelled) setCashLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const term = debouncedProductSearch.trim();
    if (scanBusy) return undefined;
    if (term.length < MIN_SEARCH_CHARS) {
      return undefined;
    }
    let cancelled = false;
    productService
      .quickSearch(term, 25)
      .then((items) => {
        if (cancelled) return;
        setSearchResults(items);
        setSearchError('');
        setSearchLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setSearchError(getErrorMessage(err));
        setSearchResults([]);
        setSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedProductSearch, scanBusy]);

  const metodoPagoValue =
    metodoPago ||
    (defaultMethod && !defaultMethod.genera_cargo_cc ? defaultMethod.codigo : 'efectivo');

  const updateCartItem = (lineKey, field, value) => {
    setCart((prev) => {
      const next = prev.map((i) => (i.lineKey === lineKey ? { ...i, [field]: value } : i));
      cartRef.current = next;
      return next;
    });
  };

  const removeFromCart = (lineKey) => {
    setCart((prev) => {
      const next = prev.filter((i) => i.lineKey !== lineKey);
      cartRef.current = next;
      return next;
    });
  };

  const openCheckout = () => {
    if (!proveedorId) {
      setError('Seleccione un proveedor');
      return;
    }
    if (!cart.length) {
      setError('Agregue al menos un producto');
      return;
    }
    setError('');
    setMontoPagado(total);
    setCheckoutOpen(true);
  };

  const handlePagadaChange = (value) => {
    setPagada(value);
    if (value) setMontoPagado(total);
    else {
      setMontoPagado(0);
      setPagaConCaja(false);
    }
  };

  const handleSubmit = async () => {
    if (isOffline) {
      setError('Sin conexión — no se puede registrar la compra.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const compra = await purchaseService.create({
        proveedor_id: Number(proveedorId),
        observaciones: observaciones.trim() || null,
        items: cart.map((i) => ({
          producto_id: i.producto_id,
          cantidad: Number(i.cantidad),
          precio_costo: Number(i.precio_costo || 0),
          precio_venta: i.precio_venta != null ? Number(i.precio_venta) : null,
          actualizar_precios: Boolean(i.actualizar_precios),
        })),
        total_manual: totalManual != null ? total : null,
        pagada,
        monto_pagado: pagada ? Number(montoPagado || 0) : 0,
        paga_con_caja: pagada ? pagaConCaja : false,
        metodo_pago: pagada ? metodoPagoValue : undefined,
      });
      navigate(`/compras/${compra.id}`, {
        state: {
          justCreated: true,
          message: `${compra.numero} · ${formatCurrency(compra.total)}`,
        },
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  const visibleResults =
    productSearch.trim().length < MIN_SEARCH_CHARS ? [] : searchResults;
  const noResults =
    !searchLoading &&
    !scanBusy &&
    productSearch.trim().length >= MIN_SEARCH_CHARS &&
    visibleResults.length === 0;

  return (
    <div className="pb-28 xl:pb-8 w-full max-w-7xl mx-auto">
      <header className="flex flex-wrap items-center gap-3 mb-5 sm:mb-6">
        <button
          type="button"
          onClick={() => navigate('/compras')}
          className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600"
          aria-label="Volver a compras"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-brand-600 shrink-0" />
            Nueva compra
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Cargá productos, actualizá costos y registrá si se pagó
          </p>
        </div>
        {cart.length > 0 && (
          <OnlineOnlyButton size="lg" className="hidden xl:inline-flex min-h-11" onClick={openCheckout}>
            Confirmar compra
          </OnlineOnlyButton>
        )}
      </header>

      {isOffline && <Alert className="mb-4">Sin conexión — la compra no se puede registrar.</Alert>}
      {error && !checkoutOpen && <Alert className="mb-4">{error}</Alert>}

      <Card title="Proveedor" className="!p-4 sm:!p-6 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            id="compra-proveedor"
            className="flex-1"
            placeholder="Seleccionar proveedor"
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            options={suppliers.map((s) => ({
              value: String(s.id),
              label: s.saldo > 0 ? `${s.nombre} · debe ${formatCurrency(s.saldo)}` : s.nombre,
            }))}
          />
          {canCreateSupplier && (
            <Button type="button" variant="outline" onClick={() => setSupplierModalOpen(true)}>
              <Truck className="w-4 h-4" />
              Nuevo
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-6">
        <Card title="Buscar producto" className="!p-4 sm:!p-6 h-fit">
          <div className="flex items-end gap-2 mb-3">
            <SearchInput
              ref={inputRef}
              id="buscar-prod-compra"
              label="Código o nombre"
              placeholder="Escanee o escriba el nombre…"
              value={productSearch}
              onChange={onChange}
              onKeyDown={onKeyDown}
              autoFocus
              hint="Enter agrega el producto"
              className="flex-1 mb-0"
            />
            {canCreateProduct && (
              <button
                type="button"
                onClick={() => setProductModalOpen(true)}
                className="shrink-0 h-12 w-12 rounded-xl border border-slate-200 text-slate-600 hover:border-brand-400 hover:text-brand-700 hover:bg-brand-50"
                title="Crear producto"
                aria-label="Crear producto"
              >
                <Plus className="w-5 h-5 mx-auto" />
              </button>
            )}
          </div>
          {searchError && <p className="text-sm text-red-600 mb-2">{searchError}</p>}
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'min(52vh, 420px)' }}>
            {(searchLoading || scanBusy) && (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            )}
            {!searchLoading && !scanBusy && productSearch.trim().length < MIN_SEARCH_CHARS && (
              <p className="text-sm text-slate-500 text-center py-12">
                Escanee un código o escriba para buscar
              </p>
            )}
            {noResults && (
              <div className="text-center py-10 px-3">
                <p className="text-sm text-slate-500 mb-3">
                  Sin resultados para &quot;{productSearch.trim()}&quot;
                </p>
                {canCreateProduct && (
                  <Button type="button" variant="outline" onClick={() => setProductModalOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Crear producto
                  </Button>
                )}
              </div>
            )}
            {!searchLoading &&
              !scanBusy &&
              visibleResults.map((p) => (
                <ProductSearchCard
                  key={p.id}
                  product={p}
                  onClick={() => addToCart(p)}
                  footer={
                    <p className="text-xs mt-1.5 text-slate-500">
                      Costo {formatCurrency(p.precio_costo)} · Stock {formatNumber(p.stock ?? 0, 2)}
                    </p>
                  }
                />
              ))}
          </div>
        </Card>

        <Card
          title="Detalle de compra"
          subtitle={cart.length ? `${cart.length} producto${cart.length !== 1 ? 's' : ''}` : 'Vacío'}
          className="!p-4 sm:!p-6"
        >
          {cart.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Escanee o busque productos para agregarlos
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-4" style={{ maxHeight: 'min(52vh, 420px)', overflowY: 'auto' }}>
                {cart.map((item) => (
                  <PurchaseCartLine
                    key={item.lineKey}
                    item={item}
                    onUpdate={updateCartItem}
                    onRemove={removeFromCart}
                    highlighted={item.lineKey === lastAddedKey}
                  />
                ))}
              </div>
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Calculado</span>
                  <span className="tabular-nums">{formatCurrency(computedTotal)}</span>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="font-semibold text-slate-800">Total</span>
                  {editingTotal ? (
                    <CurrencyInput
                      id="compra-total-manual"
                      size="md"
                      wrapperClassName="w-40"
                      value={total}
                      onChange={(v) => setTotalManual(v ?? 0)}
                      onBlur={() => setEditingTotal(false)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingTotal(true)}
                      className="text-xl font-bold text-brand-700 tabular-nums hover:underline"
                      title="Clic para indicar el total a mano"
                    >
                      {formatCurrency(total)}
                    </button>
                  )}
                </div>
                {totalManual != null && (
                  <button
                    type="button"
                    className="text-xs text-brand-700 hover:underline"
                    onClick={() => setTotalManual(null)}
                  >
                    Volver al total calculado
                  </button>
                )}
                <OnlineOnlyButton size="lg" className="w-full hidden xl:flex" onClick={openCheckout}>
                  Confirmar compra
                </OnlineOnlyButton>
              </div>
            </>
          )}
        </Card>
      </div>

      {cart.length > 0 && (
        <div className="xl:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <div className="page-padding-x pt-3 pb-1 max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-2xl font-bold tabular-nums">{formatCurrency(total)}</p>
            </div>
            <OnlineOnlyButton size="lg" onClick={openCheckout}>
              Confirmar
            </OnlineOnlyButton>
          </div>
        </div>
      )}

      <PurchaseCheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        proveedorNombre={selectedSupplier?.nombre}
        computedTotal={computedTotal}
        total={total}
        itemCount={cart.length}
        pagada={pagada}
        onPagadaChange={handlePagadaChange}
        montoPagado={montoPagado}
        onMontoPagadoChange={setMontoPagado}
        metodoPago={metodoPagoValue}
        onMetodoPagoChange={setMetodoPago}
        pagaConCaja={pagaConCaja}
        onPagaConCajaChange={setPagaConCaja}
        paymentMethods={paymentMethods}
        cashSession={cashSession}
        cashLoading={cashLoading}
        observaciones={observaciones}
        onObservacionesChange={setObservaciones}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={checkoutOpen ? error : ''}
      />

      <ProductQuickCreateModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        initialNombre={noResults ? productSearch.trim() : ''}
        onCreated={(product) => {
          addToCart(product);
          setProductSearch('');
          setSearchResults([]);
        }}
      />

      <QuickSupplierCreateModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onCreated={(proveedor) => {
          setSuppliers((prev) =>
            prev.some((s) => s.id === proveedor.id) ? prev : [...prev, proveedor]
          );
          setProveedorId(String(proveedor.id));
        }}
      />
    </div>
  );
};

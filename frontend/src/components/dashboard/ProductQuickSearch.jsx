import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, AlertTriangle, CheckCircle2, ExternalLink, ShoppingCart, Layers } from 'lucide-react';
import {
  hasPaquetePricing,
  formatPaqueteHint,
  formatPrecioResumen,
  MODOS_VENTA,
} from '../../utils/productPricing';
import { ProductSearchCard } from '../catalog/ProductSearchCard';
import { productService } from '../../services/productService';
import { useDebounce } from '../../hooks/useDebounce';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants/permissions';
import { useConnection } from '../../context/ConnectionContext';
import { Card } from '../ui/Card';
import { SearchInput } from '../ui/SearchInput';
import { Spinner } from '../ui/Spinner';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { hasNoStock, isStockNegative } from '../../utils/stockWarnings';

const MIN_CHARS = 2;

const canQuickSearch = (hasPermission) =>
  hasPermission(
    PERMISSIONS.PRODUCTOS_VER,
    PERMISSIONS.INVENTARIO_VER,
    PERMISSIONS.VENTAS_VER,
    PERMISSIONS.VENTAS_CREAR
  );

const StockBadge = ({ product }) => {
  const stock = Number(product.stock ?? 0);

  if (stock < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-red-100 text-red-800">
        <AlertTriangle className="w-3.5 h-3.5" />
        Stock negativo ({formatNumber(stock, 2)} {product.unidad_medida})
      </span>
    );
  }

  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-red-100 text-red-800">
        <AlertTriangle className="w-3.5 h-3.5" />
        Sin stock
      </span>
    );
  }

  if (product.stock_bajo) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800">
        <AlertTriangle className="w-3.5 h-3.5" />
        Stock bajo ({formatNumber(stock, 2)} {product.unidad_medida})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800">
      <CheckCircle2 className="w-3.5 h-3.5" />
      Disponible: {formatNumber(stock, 2)} {product.unidad_medida}
    </span>
  );
};

export const ProductQuickSearch = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { isOffline } = useConnection();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const debouncedQuery = useDebounce(query, 280);

  const canCreateSale = hasPermission(PERMISSIONS.VENTAS_CREAR);

  const showCatalogLink = hasPermission(
    PERMISSIONS.PRODUCTOS_VER,
    PERMISSIONS.PRODUCTOS_CREAR,
    PERMISSIONS.PRODUCTOS_EDITAR
  );

  useEffect(() => {
    const term = debouncedQuery.trim();
    if (term.length < MIN_CHARS) {
      setResults([]);
      setHasSearched(false);
      setError('');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    productService
      .quickSearch(term)
      .then((productos) => {
        if (!cancelled) {
          setResults(productos);
          setHasSearched(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setResults([]);
          setHasSearched(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleProductClick = (product) => {
    if (!canCreateSale) return;
    setSelectedProduct(product);
  };

  const handleConfirmAddToSale = (modo = MODOS_VENTA.SUELTO) => {
    if (!selectedProduct || isOffline) return;

    navigate('/ventas/nueva', {
      state: {
        addProduct: selectedProduct,
        addProductModo: modo,
        message: hasNoStock(selectedProduct)
          ? `«${selectedProduct.nombre}» agregado — sin stock disponible.`
          : null,
      },
    });
    setSelectedProduct(null);
  };

  if (!canQuickSearch(hasPermission)) return null;

  return (
    <>
      <Card className="!p-0 overflow-hidden border-2 border-brand-200/80 shadow-lg" title={null}>
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Consulta rápida de productos</h2>
                <p className="text-sm text-slate-300">
                  Precio y stock al instante — tocá un resultado para vender
                </p>
              </div>
            </div>
            {showCatalogLink && (
              <Link
                to="/catalogo/productos"
                className="inline-flex items-center gap-1.5 text-sm text-brand-300 hover:text-brand-200 font-medium shrink-0"
              >
                Ver catálogo <ExternalLink className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <SearchInput
            id="dashboard-product-quick-search"
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => {
              setQuery('');
              setResults([]);
              setHasSearched(false);
              inputRef.current?.focus();
            }}
            placeholder="Código o nombre del producto..."
            hint={`Mínimo ${MIN_CHARS} caracteres. Ej: código de barras, nombre parcial`}
            size="lg"
            autoFocus
          />

          {query.trim().length > 0 && query.trim().length < MIN_CHARS && (
            <p className="text-sm text-slate-500 text-center py-2">
              Escriba al menos {MIN_CHARS} caracteres para buscar
            </p>
          )}

          {loading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}

          {error && !loading && (
            <p className="text-sm text-red-600 text-center py-4">{error}</p>
          )}

          {!loading && !error && hasSearched && results.length === 0 && (
            <div className="text-center py-10 rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-600">No se encontraron productos activos</p>
              <p className="text-sm text-slate-500 mt-1">Pruebe con otro código o nombre</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((product) => (
                <ProductSearchCard
                  key={product.id}
                  product={product}
                  priceLabel="Precio venta"
                  onClick={canCreateSale ? () => handleProductClick(product) : undefined}
                  footer={
                    <div className="mt-2 space-y-1">
                      {product.categoria_nombre && (
                        <p className="text-xs text-slate-400">{product.categoria_nombre}</p>
                      )}
                      <StockBadge product={product} />
                      {canCreateSale && (
                        <p className="text-xs text-brand-600 font-medium">Tocar para agregar a venta</p>
                      )}
                    </div>
                  }
                />
              ))}
            </div>
          )}

          {!loading && !query.trim() && (
            <p className="text-sm text-slate-400 text-center py-6">
              Escanee o escriba el producto que le consulta el cliente
            </p>
          )}
        </div>
      </Card>

      <Modal
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        title="Agregar a venta"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelectedProduct(null)}>
              Cancelar
            </Button>
            {selectedProduct && hasPaquetePricing(selectedProduct) ? (
              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleConfirmAddToSale(MODOS_VENTA.SUELTO)}
                  disabled={isOffline}
                >
                  <Layers className="w-4 h-4" />
                  Suelto
                </Button>
                <Button
                  onClick={() => handleConfirmAddToSale(MODOS_VENTA.PAQUETE)}
                  disabled={isOffline}
                >
                  <Package className="w-4 h-4" />
                  Paquete
                </Button>
              </div>
            ) : (
              <Button onClick={() => handleConfirmAddToSale()} disabled={isOffline}>
                <ShoppingCart className="w-4 h-4" />
                Ir a venta
              </Button>
            )}
          </>
        }
      >
        {selectedProduct && (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-800">{selectedProduct.nombre}</p>
              <p className="text-sm text-slate-500 font-mono mt-0.5">{selectedProduct.codigo}</p>
              {hasPaquetePricing(selectedProduct) ? (
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border border-slate-200 bg-white p-2">
                    <p className="text-[10px] uppercase text-slate-500 font-medium">Suelto</p>
                    <p className="font-bold text-brand-700 tabular-nums">
                      {formatPrecioResumen(selectedProduct, MODOS_VENTA.SUELTO)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-2">
                    <p className="text-[10px] uppercase text-slate-500 font-medium">Paquete</p>
                    <p className="font-bold text-brand-700 tabular-nums">
                      {formatCurrency(selectedProduct.precio_venta_paquete)}
                    </p>
                    {formatPaqueteHint(selectedProduct) && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {formatPaqueteHint(selectedProduct)}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-lg font-bold text-brand-700 mt-2 tabular-nums">
                  {formatCurrency(selectedProduct.precio_venta)}
                </p>
              )}
              <div className="mt-3">
                <StockBadge product={selectedProduct} />
              </div>
            </div>

            <p className="text-sm text-slate-600">
              ¿Desea agregar este producto a una nueva venta? Se abrirá el registro de ventas con el
              artículo ya en el carrito.
            </p>

            {(hasNoStock(selectedProduct) || isStockNegative(selectedProduct)) && (
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>
                  Este producto no tiene stock suficiente. Podés venderlo igual; el inventario
                  quedará en negativo.
                </p>
              </div>
            )}

            {isOffline && (
              <p className="text-sm text-red-600">
                Sin conexión — no podés registrar ventas hasta recuperar internet.
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronDown, Search, X, Package, Loader2 } from 'lucide-react';
import { ProductImage } from './ProductImage';
import { productService } from '../../services/productService';
import { useDebounce } from '../../hooks/useDebounce';
import { formatNumber } from '../../utils/formatCurrency';
import { fieldBase, fieldSizes, fieldNormal, fieldError } from '../ui/fieldStyles';

const MIN_CHARS = 2;

export const ProductPicker = ({
  value,
  onChange,
  label = 'Producto',
  id = 'producto-picker',
  size = 'md',
  error,
  allowAll = false,
  allLabel = 'Todos los productos',
  placeholder = 'Buscar por código o nombre…',
  selectedProduct: selectedProductProp = null,
  products = [],
  onProductSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [cachedSelected, setCachedSelected] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 280);

  const selected = useMemo(() => {
    if (!value) return null;
    const fromProp = selectedProductProp?.id === Number(value) ? selectedProductProp : null;
    const fromCache = cachedSelected?.id === Number(value) ? cachedSelected : null;
    const fromList = products.find((p) => String(p.id) === String(value));
    const fromResults = results.find((p) => String(p.id) === String(value));
    return fromProp || fromCache || fromList || fromResults || null;
  }, [value, selectedProductProp, cachedSelected, products, results]);

  const localFiltered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return products.slice(0, 20);
    return products.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(term) ||
        p.codigo?.toLowerCase().includes(term)
    );
  }, [products, query]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSearchError('');
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  const runSearch = useCallback(async (term) => {
    if (term.length < MIN_CHARS) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setSearchError('');
    try {
      const productos = await productService.quickSearch(term, 25);
      setResults(productos);
    } catch {
      setSearchError('Error al buscar productos');
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const term = debouncedQuery.trim();
    if (products.length > 0 && !term) {
      setResults([]);
      setSearching(false);
      return;
    }
    runSearch(term);
  }, [debouncedQuery, open, products.length, runSearch]);

  const displayList = useMemo(() => {
    const term = query.trim();
    if (products.length > 0 && term.length < MIN_CHARS) return localFiltered;
    if (term.length >= MIN_CHARS) return results;
    return [];
  }, [products.length, query, localFiltered, results]);

  const handleSelect = (product) => {
    setCachedSelected(product);
    onChange(String(product.id));
    onProductSelect?.(product);
    setOpen(false);
    setQuery('');
  };

  const handleClearAll = () => {
    setCachedSelected(null);
    onChange('');
    setOpen(false);
    setQuery('');
  };

  const sizeClass = fieldSizes[size] || fieldSizes.md;
  const borderClass = error ? fieldError : fieldNormal;
  const trimmedQuery = query.trim();

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${fieldBase} ${sizeClass} ${borderClass} w-full flex items-center gap-2 text-left`}
      >
        {selected ? (
          <>
            <ProductImage src={selected.imagen_url} alt={selected.nombre} size="xs" />
            <span className="flex-1 min-w-0 truncate text-slate-800">
              <span className="font-medium">{selected.nombre}</span>
              <span className="text-slate-500 font-mono text-xs ml-1.5">{selected.codigo}</span>
            </span>
          </>
        ) : (
          <span className="flex-1 truncate text-slate-400">
            {allowAll ? allLabel : placeholder}
          </span>
        )}
        <ChevronDown
          className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[280px] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full h-9 pl-9 pr-9 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  aria-label="Limpiar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {allowAll && (
            <button
              type="button"
              onClick={handleClearAll}
              className={`w-full text-left px-3 py-2.5 text-sm border-b border-slate-100 hover:bg-slate-50 ${
                !value ? 'bg-brand-50 text-brand-900 font-medium' : 'text-slate-700'
              }`}
            >
              {allLabel}
            </button>
          )}

          <ul className="max-h-52 overflow-y-auto overscroll-contain py-1">
            {trimmedQuery.length > 0 && trimmedQuery.length < MIN_CHARS && (
              <li className="px-3 py-4 text-center text-sm text-slate-500">
                Escriba al menos {MIN_CHARS} caracteres
              </li>
            )}

            {searching && (
              <li className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-brand-600 animate-spin" />
              </li>
            )}

            {searchError && !searching && (
              <li className="px-3 py-4 text-center text-sm text-red-600">{searchError}</li>
            )}

            {!searching && !searchError && displayList.length === 0 && trimmedQuery.length >= MIN_CHARS && (
              <li className="px-3 py-6 text-center text-sm text-slate-500">
                Sin productos para &quot;{trimmedQuery}&quot;
              </li>
            )}

            {!searching &&
              !searchError &&
              displayList.length === 0 &&
              trimmedQuery.length < MIN_CHARS &&
              products.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-slate-500">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Busque por código o nombre
                </li>
              )}

            {displayList.map((product) => (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(product)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                    String(value) === String(product.id)
                      ? 'bg-brand-50 text-brand-900'
                      : 'text-slate-800'
                  }`}
                >
                  <ProductImage src={product.imagen_url} alt={product.nombre} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.nombre}</p>
                    <p className="text-xs text-slate-500 font-mono">{product.codigo}</p>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0 tabular-nums">
                    {formatNumber(product.stock, 0)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, X, FolderPlus } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants/permissions';
import { fieldBase, fieldSizes, fieldNormal, fieldError } from '../ui/fieldStyles';
import { QuickCategoryCreateModal } from './QuickCategoryCreateModal';

export const CategoryPicker = ({
  value,
  onChange,
  categories = [],
  onCategoryCreated,
  label = 'Categoría',
  id = 'categoria-picker',
  size = 'md',
  error,
}) => {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.CATEGORIAS_CREAR);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selected = useMemo(
    () => categories.find((c) => String(c.id) === String(value)),
    [categories, value]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((c) => c.nombre.toLowerCase().includes(term));
  }, [categories, query]);

  const trimmedQuery = query.trim();

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
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  const handleSelect = (cat) => {
    onChange(String(cat.id));
    setOpen(false);
    setQuery('');
  };

  const openQuickCreate = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setOpen(false);
    setQuickCreateOpen(true);
  };

  const handleCreated = (categoria) => {
    if (!categoria?.id) return;
    onCategoryCreated?.(categoria);
    onChange(String(categoria.id));
    setQuickCreateOpen(false);
    setOpen(false);
    setQuery('');
  };

  const sizeClass = fieldSizes[size] || fieldSizes.md;
  const borderClass = error ? fieldError : fieldNormal;

  return (
    <>
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
          className={`${fieldBase} ${sizeClass} ${borderClass} w-full flex items-center justify-between gap-2 text-left`}
        >
          <span className={`truncate ${selected ? 'text-slate-800' : 'text-slate-400'}`}>
            {selected ? selected.nombre : 'Seleccione categoría…'}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

        {open && (
          <div className="absolute z-40 mt-1.5 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar categoría…"
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

            <ul className="max-h-44 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-slate-500">
                  {trimmedQuery
                    ? `Sin categorías para "${trimmedQuery}"`
                    : 'No hay categorías activas'}
                </li>
              )}
              {filtered.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(cat)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                      String(value) === String(cat.id)
                        ? 'bg-brand-50 text-brand-900 font-medium'
                        : 'text-slate-800'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                </li>
              ))}
            </ul>

            {canCreate && (
              <div className="border-t border-slate-100 p-2 space-y-1">
                {trimmedQuery && filtered.length === 0 && (
                  <button
                    type="button"
                    onClick={openQuickCreate}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-600"
                  >
                    <FolderPlus className="w-4 h-4" />
                    Crear &quot;{trimmedQuery}&quot;
                  </button>
                )}
                <button
                  type="button"
                  onClick={openQuickCreate}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-brand-800 hover:bg-brand-50"
                >
                  <FolderPlus className="w-4 h-4" />
                  Nueva categoría
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <QuickCategoryCreateModal
        isOpen={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        initialNombre={trimmedQuery}
        onCreated={handleCreated}
      />
    </>
  );
};

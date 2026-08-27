import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, User, Search, X, Loader2, UserPlus } from 'lucide-react';
import { clientService } from '../../services/clientService';
import { useDebounce } from '../../hooks/useDebounce';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants/permissions';
import { fieldBase, fieldSizes, fieldNormal } from '../ui/fieldStyles';
import { formatCurrency } from '../../utils/formatCurrency';
import { QuickClientCreateModal } from './QuickClientCreateModal';

const CONSUMIDOR_FINAL = { id: '', nombre: 'Consumidor final (sin cliente)' };

const formatClientDoc = (client) => {
  if (client.numero_documento) return client.numero_documento;
  if (client.documento) return client.documento;
  if (client.telefono) return client.telefono;
  return 'Sin datos';
};

export const ClientSearchSelect = ({
  value,
  onChange,
  onClientSelect,
  clients = [],
  label = 'Cliente',
  id = 'client-search',
  size = 'md',
  disabled = false,
}) => {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.CLIENTES_CREAR);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateName, setQuickCreateName] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedQuery = useDebounce(query, 280);

  const selectedClient = useMemo(() => {
    if (!value) return CONSUMIDOR_FINAL;
    return clients.find((c) => String(c.id) === String(value)) || null;
  }, [value, clients]);

  const displayLabel = selectedClient
    ? selectedClient.nombre || selectedClient.label
    : value
      ? `Cliente #${value}`
      : CONSUMIDOR_FINAL.nombre;

  const trimmedQuery = query.trim();
  const showNoResults = !searching && trimmedQuery.length >= 2 && results.length === 0;

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
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      return;
    }

    const term = debouncedQuery.trim();
    if (term.length < 2) {
      setResults(clients.slice(0, 12));
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    clientService
      .search(term, 20)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open, clients]);

  const handleSelect = (client) => {
    const clientId = client?.id ? String(client.id) : '';
    onChange(clientId);
    onClientSelect?.(client?.id ? client : null);
    setOpen(false);
    setQuery('');
  };

  const openQuickCreate = (name = trimmedQuery) => {
    setQuickCreateName(name);
    setQuickCreateOpen(true);
    setOpen(false);
  };

  const handleClientCreated = (client) => {
    handleSelect(client);
  };

  const sizeClass = fieldSizes[size] || fieldSizes.md;

  return (
    <>
      <div ref={containerRef} className="relative w-full min-w-0">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-2">
            {label}
          </label>
        )}
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={`${fieldBase} ${sizeClass} ${fieldNormal} w-full flex items-center justify-between gap-2 text-left disabled:opacity-50`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">{displayLabel}</span>
          </span>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, DNI, teléfono…"
                  className="w-full h-10 pl-9 pr-9 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 px-1">
                {trimmedQuery.length < 2
                  ? 'Clientes recientes o escriba 2+ caracteres'
                  : 'Resultados de búsqueda'}
              </p>
            </div>

            <ul className="max-h-52 overflow-y-auto overscroll-contain py-1">
              <li>
                <button
                  type="button"
                  onClick={() => handleSelect(CONSUMIDOR_FINAL)}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 ${
                    !value ? 'bg-brand-50 text-brand-900 font-medium' : 'text-slate-700'
                  }`}
                >
                  {CONSUMIDOR_FINAL.nombre}
                </button>
              </li>
              {searching && (
                <li className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando…
                </li>
              )}
              {!searching &&
                results.map((client) => (
                  <li key={client.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(client)}
                      className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 ${
                        String(value) === String(client.id)
                          ? 'bg-brand-50 text-brand-900'
                          : 'text-slate-800'
                      }`}
                    >
                      <p className="text-sm font-medium truncate">{client.nombre}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatClientDoc(client)}
                        {client.saldo_cuenta_corriente != null && (
                          <> · CC {formatCurrency(client.saldo_cuenta_corriente)}</>
                        )}
                      </p>
                    </button>
                  </li>
                ))}
              {showNoResults && (
                <li className="px-3 py-4 text-center">
                  <p className="text-sm text-slate-500 mb-3">
                    Sin resultados para &quot;{trimmedQuery}&quot;
                  </p>
                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => openQuickCreate(trimmedQuery)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Crear &quot;{trimmedQuery}&quot;
                    </button>
                  )}
                </li>
              )}
            </ul>

            {canCreate && (
              <div className="border-t border-slate-100 p-2">
                <button
                  type="button"
                  onClick={() => openQuickCreate('')}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-brand-800 hover:bg-brand-50 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Crear cliente nuevo
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <QuickClientCreateModal
        isOpen={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        initialNombre={quickCreateName}
        onCreated={handleClientCreated}
      />
    </>
  );
};

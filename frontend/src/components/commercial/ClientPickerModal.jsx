import { useState, useEffect } from 'react';
import { User, Search, UserPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { clientService } from '../../services/clientService';
import { useDebounce } from '../../hooks/useDebounce';
import { usePermissions } from '../../hooks/usePermissions';
import { PERMISSIONS } from '../../constants/permissions';
import { Spinner } from '../ui/Spinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { QuickClientCreateModal } from './QuickClientCreateModal';

export const ClientPickerModal = ({ isOpen, onClose, onSelect, title = 'Seleccionar cliente' }) => {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.CLIENTES_CREAR);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const trimmedQuery = query.trim();
  const showNoResults = !loading && trimmedQuery.length >= 2 && results.length === 0;

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const term = debouncedQuery.trim();
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    clientService
      .search(term, 25)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isOpen]);

  const handleSelect = (client) => {
    onSelect(client);
    onClose();
  };

  const handleClientCreated = (client) => {
    onSelect(client);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size="sm"
        footer={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:justify-end">
            {canCreate && (
              <Button
                variant="outline"
                onClick={() => setQuickCreateOpen(true)}
                className="w-full sm:w-auto order-first sm:order-none"
              >
                <UserPlus className="w-4 h-4" />
                Crear cliente
              </Button>
            )}
            <Button variant="ghost" onClick={onClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Busque el cliente para cargar la venta en cuenta corriente.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre, DNI o teléfono…"
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500"
            />
          </div>

          <div className="min-h-[200px] max-h-[min(50vh,320px)] overflow-y-auto rounded-xl border border-slate-200">
            {trimmedQuery.length < 2 && (
              <p className="text-sm text-slate-500 text-center py-12 px-4">
                Escriba al menos 2 caracteres para buscar
              </p>
            )}
            {loading && (
              <div className="flex justify-center py-12">
                <Spinner />
              </div>
            )}
            {showNoResults && (
              <div className="text-center py-10 px-4">
                <p className="text-sm text-slate-500 mb-4">
                  No se encontraron clientes para &quot;{trimmedQuery}&quot;
                </p>
                {canCreate && (
                  <Button onClick={() => setQuickCreateOpen(true)}>
                    <UserPlus className="w-4 h-4" />
                    Crear &quot;{trimmedQuery}&quot;
                  </Button>
                )}
              </div>
            )}
            {!loading &&
              results.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelect(client)}
                  className="w-full flex items-start gap-3 p-3 text-left hover:bg-brand-50/60 border-b border-slate-100 last:border-0 transition-colors"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                    <User className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate">{client.nombre}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {client.numero_documento || '—'}
                      {client.telefono ? ` · ${client.telefono}` : ''}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Saldo CC:{' '}
                      <strong>{formatCurrency(client.saldo_cuenta_corriente ?? 0)}</strong>
                      {client.limite_credito != null && (
                        <> · Límite {formatCurrency(client.limite_credito)}</>
                      )}
                    </p>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </Modal>

      <QuickClientCreateModal
        isOpen={quickCreateOpen}
        onClose={() => setQuickCreateOpen(false)}
        initialNombre={trimmedQuery}
        onCreated={handleClientCreated}
        title="Nuevo cliente — cuenta corriente"
      />
    </>
  );
};

import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

/**
 * Barra de filtros unificada: búsqueda amplia + controles secundarios
 */
export const FilterToolbar = ({
  search,
  filters,
  onRefresh,
  refreshLabel = 'Actualizar listado',
  className = '',
}) => {
  const filterItems = Array.isArray(filters) ? filters : filters ? [filters] : [];

  return (
  <div
    className={`rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-white p-4 sm:p-5 ${className}`}
  >
    <div
      className={`flex flex-col gap-4 ${
        search ? 'lg:flex-row lg:items-end' : ''
      }`}
    >
      {search && (
        <div className="flex-1 min-w-0 w-full lg:min-w-[280px]">
          {search}
        </div>
      )}

      {(filterItems.length > 0 || onRefresh) && (
        <div
          className={`flex flex-col sm:flex-row gap-3 sm:items-end ${
            search ? 'shrink-0' : 'w-full'
          }`}
        >
          {filterItems.map((filter, index) => (
            <div
              key={filter.key ?? index}
              className="w-full sm:w-auto sm:min-w-[200px]"
            >
              {filter}
            </div>
          ))}

          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onRefresh}
              aria-label={refreshLabel}
              title={refreshLabel}
              className="h-11 px-4 shrink-0 border-slate-200 hover:border-brand-400 hover:bg-brand-50/50"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Actualizar</span>
            </Button>
          )}
        </div>
      )}
    </div>
  </div>
  );
};

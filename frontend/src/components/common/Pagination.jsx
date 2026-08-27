import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { PAGE_SIZE_OPTIONS } from '../../constants/pagination';
import { getShowingRange, getVisiblePages } from '../../utils/paginationUtils';

const pageBtnClass = (active) =>
  `min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-medium transition-colors ${
    active
      ? 'bg-brand-600 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200'
  }`;

export const Pagination = ({
  page,
  limit,
  total = 0,
  totalPages = 1,
  onPageChange,
  onLimitChange,
  showPageSize = true,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  itemLabel = 'registros',
  className = '',
}) => {
  if (!total || total <= 0) return null;

  const { from, to } = getShowingRange(page, limit, total);
  const visiblePages = getVisiblePages(page, totalPages);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div
      className={`flex flex-col gap-4 mt-6 pt-4 border-t border-slate-100 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-sm text-slate-600">
          Mostrando{' '}
          <span className="font-medium text-slate-800 tabular-nums">
            {from}–{to}
          </span>{' '}
          de{' '}
          <span className="font-medium text-slate-800 tabular-nums">{total}</span>{' '}
          {itemLabel}
        </p>

        {showPageSize && onLimitChange && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">Por página</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500"
              aria-label="Registros por página"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center sm:justify-end gap-1"
          aria-label="Paginación"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={!canPrev}
            onClick={() => onPageChange(1)}
            className="!px-2"
            aria-label="Primera página"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canPrev}
            onClick={() => onPageChange(page - 1)}
            className="!px-2.5"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Anterior</span>
          </Button>

          <div className="hidden md:flex items-center gap-0.5 mx-1">
            {visiblePages.map((p, idx) =>
              p === 'ellipsis' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-slate-400 select-none"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={pageBtnClass(p === page)}
                  aria-label={`Página ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <span className="md:hidden text-sm text-slate-600 px-2 tabular-nums whitespace-nowrap">
            {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => onPageChange(page + 1)}
            className="!px-2.5"
            aria-label="Página siguiente"
          >
            <span className="hidden sm:inline mr-1">Siguiente</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => onPageChange(totalPages)}
            className="!px-2"
            aria-label="Última página"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </nav>
      )}
    </div>
  );
};

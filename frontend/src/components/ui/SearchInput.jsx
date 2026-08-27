import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';
import { fieldBase, fieldSizes, fieldError, fieldNormal } from './fieldStyles';

export const SearchInput = forwardRef(function SearchInput(
  {
    label,
    hint,
    value = '',
    onChange,
    onClear,
    placeholder = 'Buscar...',
    id = 'search',
    error,
    size = 'lg',
    className = '',
    inputClassName = '',
    autoFocus = false,
  },
  ref
) {
  const sizeClass = fieldSizes[size] || fieldSizes.lg;
  const borderClass = error ? fieldError : fieldNormal;

  const handleClear = () => {
    onChange?.({ target: { value: '' } });
    onClear?.();
  };

  return (
    <div className={`w-full min-w-0 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
          aria-hidden
        />
        <input
          ref={ref}
          id={id}
          type="search"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="off"
          autoFocus={autoFocus}
          className={`${fieldBase} ${sizeClass} ${borderClass} pl-11 pr-11 ${inputClassName}`}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
});

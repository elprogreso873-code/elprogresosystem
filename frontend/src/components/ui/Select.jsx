import { ChevronDown } from 'lucide-react';
import { fieldBase, fieldSizes, fieldError, fieldNormal } from './fieldStyles';

export const Select = ({
  label,
  hint,
  error,
  id,
  options = [],
  placeholder,
  hidePlaceholder = false,
  size = 'md',
  className = '',
  wrapperClassName = '',
  ...props
}) => {
  const sizeClass = fieldSizes[size] || fieldSizes.md;
  const borderClass = error ? fieldError : fieldNormal;
  const showPlaceholder = placeholder && !hidePlaceholder;

  return (
    <div className={`w-full min-w-0 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          {label}
        </label>
      )}
      <div className={`relative ${className}`}>
        <select
          id={id}
          className={`${fieldBase} ${sizeClass} ${borderClass} appearance-none cursor-pointer pr-11`}
          {...props}
        >
          {showPlaceholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
          aria-hidden
        />
      </div>
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
};

import { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { fieldBase, fieldSizes, fieldError, fieldNormal } from './fieldStyles';
import {
  formatCurrencyInputString,
  numberToCurrencyInputString,
  parseCurrencyInput,
  clampCurrencyValue,
} from '../../utils/currencyInput';

export const CurrencyInput = forwardRef(function CurrencyInput(
  {
    label,
    hint,
    error,
    id,
    name,
    size = 'md',
    className = '',
    wrapperClassName = '',
    value,
    onChange,
    onBlur,
    decimals = 2,
    min = 0,
    max,
    allowEmpty = false,
    emptyZero = false,
    prefix = '$',
    disabled = false,
    placeholder = '0',
    ...rest
  },
  ref
) {
  const [display, setDisplay] = useState(() =>
    numberToCurrencyInputString(value, { decimals, emptyZero })
  );
  const focusedRef = useRef(false);
  const inputRef = useRef(null);

  const setRefs = useCallback(
    (node) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  useEffect(() => {
    if (!focusedRef.current) {
      setDisplay(numberToCurrencyInputString(value, { decimals, emptyZero }));
    }
  }, [value, decimals, emptyZero]);

  const emitChange = (rawDisplay) => {
    const parsed = parseCurrencyInput(rawDisplay);
    if (parsed === null) {
      if (allowEmpty && (rawDisplay === '' || rawDisplay === '0,')) {
        onChange?.(null);
      } else if (rawDisplay === '' || rawDisplay === '0,') {
        onChange?.(0);
      }
      return;
    }
    const clamped = clampCurrencyValue(parsed, { min, max });
    onChange?.(clamped);
  };

  const handleFocus = (e) => {
    focusedRef.current = true;
    rest.onFocus?.(e);
  };

  const handleChange = (e) => {
    const formatted = formatCurrencyInputString(e.target.value);
    setDisplay(formatted);
    emitChange(formatted);
  };

  const handleBlur = (e) => {
    focusedRef.current = false;
    const parsed = parseCurrencyInput(display);
    let final =
      parsed === null
        ? allowEmpty
          ? null
          : 0
        : clampCurrencyValue(parsed, { min, max });

    if (final != null && !Number.isNaN(final)) {
      onChange?.(final);
      setDisplay(numberToCurrencyInputString(final, { decimals, emptyZero }));
    } else {
      setDisplay('');
      onChange?.(allowEmpty ? null : 0);
    }

    onBlur?.(e);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const formatted = formatCurrencyInputString(text);
    setDisplay(formatted);
    emitChange(formatted);
  };

  const sizeClass = fieldSizes[size] || fieldSizes.md;
  const borderClass = error ? fieldError : fieldNormal;

  return (
    <div className={`w-full min-w-0 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {prefix && (
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium pointer-events-none z-10"
            aria-hidden
          >
            {prefix}
          </span>
        )}
        <input
          ref={setRefs}
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={display}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onPaste={handlePaste}
          className={`${fieldBase} ${sizeClass} ${borderClass} ${prefix ? 'pl-9 pr-4' : 'px-4'} tabular-nums ${className}`}
          aria-invalid={Boolean(error)}
          {...rest}
        />
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
});

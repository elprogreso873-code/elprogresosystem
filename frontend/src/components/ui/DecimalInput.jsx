import { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
import { fieldBase, fieldSizes, fieldError, fieldNormal } from './fieldStyles';
import {
  numberToDecimalInputString,
  sanitizeDecimalInputString,
  parseDecimalInput,
  clampDecimalValue,
  selectAllOnFocus,
  inferDecimalsFromStep,
} from '../../utils/decimalInput';
import { preventWheelOnNumberInput } from '../../utils/numberInput';

export const DecimalInput = forwardRef(function DecimalInput(
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
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    decimals: decimalsProp,
    min,
    max,
    step,
    emptyZero = true,
    fallbackOnBlur,
    selectOnFocus = true,
    bare = false,
    disabled = false,
    placeholder = '',
    allowWheelOnNumber = false,
    ...rest
  },
  ref
) {
  const decimals = decimalsProp ?? inferDecimalsFromStep(step);
  const initial = value ?? defaultValue;

  const [display, setDisplay] = useState(() =>
    numberToDecimalInputString(initial, { decimals, emptyZero })
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
    if (!focusedRef.current && value !== undefined) {
      setDisplay(numberToDecimalInputString(value, { decimals, emptyZero }));
    }
  }, [value, decimals, emptyZero]);

  const commitValue = (rawDisplay, { finalBlur = false } = {}) => {
    const parsed = parseDecimalInput(rawDisplay);

    if (parsed === null) {
      if (rawDisplay === '' || rawDisplay === ',' || rawDisplay === '.') {
        if (finalBlur) {
          const fallback =
            fallbackOnBlur != null
              ? fallbackOnBlur
              : min != null && min > 0
                ? min
                : emptyZero
                  ? 0
                  : null;
          if (fallback != null) {
            onChange?.(fallback);
            setDisplay(numberToDecimalInputString(fallback, { decimals, emptyZero }));
          } else {
            onChange?.(null);
            setDisplay('');
          }
        }
      }
      return;
    }

    const clamped = clampDecimalValue(parsed, { min, max });
    onChange?.(clamped);
    if (finalBlur) {
      setDisplay(numberToDecimalInputString(clamped, { decimals, emptyZero }));
    }
  };

  const handleFocus = (e) => {
    focusedRef.current = true;
    if (selectOnFocus) selectAllOnFocus(inputRef.current ?? e.target);
    onFocus?.(e);
  };

  const handleChange = (e) => {
    const sanitized = sanitizeDecimalInputString(e.target.value, decimals);
    setDisplay(sanitized);
    commitValue(sanitized);
  };

  const handleBlur = (e) => {
    focusedRef.current = false;
    commitValue(display, { finalBlur: true });
    onBlur?.(e);
  };

  const handleWheel = (e) => {
    if (!allowWheelOnNumber) preventWheelOnNumberInput(e);
    rest.onWheel?.(e);
  };

  const sizeClass = fieldSizes[size] || fieldSizes.md;
  const borderClass = error ? fieldError : fieldNormal;

  const inputEl = (
    <input
      ref={setRefs}
      id={id}
      name={name}
      type="text"
      inputMode={decimals === 0 ? 'numeric' : 'decimal'}
      autoComplete="off"
      disabled={disabled}
      placeholder={placeholder}
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onWheel={handleWheel}
      className={
        bare
          ? className
          : `${fieldBase} ${sizeClass} ${borderClass} px-4 tabular-nums ${className}`
      }
      aria-invalid={Boolean(error)}
      {...rest}
    />
  );

  if (bare) return inputEl;

  return (
    <div className={`w-full min-w-0 ${wrapperClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">{inputEl}</div>
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
});

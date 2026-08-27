import { fieldBase, fieldSizes, fieldError, fieldNormal } from './fieldStyles';
import { DecimalInput } from './DecimalInput';

export const Input = ({
  label,
  hint,
  error,
  id,
  size = 'md',
  className = '',
  wrapperClassName = '',
  icon: Icon,
  iconPosition = 'left',
  type,
  onWheel,
  allowWheelOnNumber = false,
  onChange,
  onBlur,
  ref,
  min,
  max,
  step,
  value,
  defaultValue,
  emptyZero,
  decimals,
  fallbackOnBlur,
  selectOnFocus,
  ...props
}) => {
  if (type === 'number') {
    return (
      <DecimalInput
        label={label}
        hint={hint}
        error={error}
        id={id}
        size={size}
        className={className}
        wrapperClassName={wrapperClassName}
        min={min}
        max={max}
        step={step}
        value={value}
        defaultValue={defaultValue}
        emptyZero={emptyZero !== false}
        decimals={decimals}
        fallbackOnBlur={fallbackOnBlur}
        selectOnFocus={selectOnFocus !== false}
        allowWheelOnNumber={allowWheelOnNumber}
        ref={ref}
        onBlur={onBlur}
        onChange={(num) => {
          onChange?.({
            target: { name: props.name, value: num ?? '' },
          });
        }}
        {...props}
      />
    );
  }

  const sizeClass = fieldSizes[size] || fieldSizes.md;
  const borderClass = error ? fieldError : fieldNormal;
  const hasIcon = Boolean(Icon);
  const paddingClass = hasIcon
    ? iconPosition === 'left'
      ? 'pl-11 pr-4'
      : 'pl-4 pr-11'
    : 'px-4';

  const handleWheel = (event) => {
    onWheel?.(event);
  };

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
      <div className="relative">
        {hasIcon && (
          <Icon
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none ${
              iconPosition === 'left' ? 'left-4' : 'right-4'
            }`}
            aria-hidden
          />
        )}
        <input
          id={id}
          type={type}
          ref={ref}
          onWheel={handleWheel}
          onChange={onChange}
          onBlur={onBlur}
          className={`${fieldBase} ${sizeClass} ${borderClass} ${paddingClass} ${className}`}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
};

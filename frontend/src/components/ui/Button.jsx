const variants = {
  primary:
    'bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md hover:shadow-lg',
  secondary:
    'bg-slate-700 hover:bg-slate-800 text-white font-medium',
  outline:
    'bg-white border border-slate-200 text-slate-700 hover:border-brand-400 hover:bg-brand-50/60 font-medium shadow-sm',
  danger:
    'bg-red-600 hover:bg-red-700 text-white font-medium',
  ghost: 'text-slate-600 hover:bg-slate-100 font-medium',
};

const sizes = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-4 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-xl',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  disabled = false,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    disabled={disabled || isLoading}
    className={`inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    {...props}
  >
    {isLoading && (
      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
    )}
    {children}
  </button>
);

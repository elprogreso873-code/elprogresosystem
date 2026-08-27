import { fieldNormal } from './fieldStyles';

const variants = {
  outline:
    'bg-white border border-slate-200 text-slate-600 hover:border-brand-400 hover:bg-brand-50/50 hover:text-slate-800 shadow-sm',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
};

export const IconButton = ({
  children,
  variant = 'outline',
  size = 'md',
  className = '',
  title,
  ...props
}) => {
  const sizes = {
    md: 'h-11 w-11 rounded-xl',
    lg: 'h-12 w-12 rounded-xl',
  };

  return (
    <button
      type="button"
      title={title}
      className={`inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-400/40 disabled:opacity-50 ${variants[variant]} ${fieldNormal} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

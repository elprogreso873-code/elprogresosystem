const variants = {
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
};

export const Alert = ({ children, variant = 'error', className = '' }) => (
  <div className={`px-4 py-3 rounded-xl border text-sm ${variants[variant]} ${className}`}>
    {children}
  </div>
);

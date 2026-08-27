const styles = {
  activo: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  inactivo: 'bg-slate-100 text-slate-600 border-slate-200',
  admin: 'bg-brand-100 text-brand-800 border-brand-200',
  empleado: 'bg-blue-100 text-blue-800 border-blue-200',
  vendedor: 'bg-slate-100 text-slate-600 border-slate-200',
  cajero: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const Badge = ({ children, variant = 'activo' }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles[variant] || styles.activo}`}
  >
    {children}
  </span>
);

export const Card = ({ children, className = '', title, subtitle, action }) => (
  <div className={`glass-card rounded-2xl p-6 ${className}`}>
    {(title || action) && (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          {title && <h2 className="text-lg font-semibold text-slate-800">{title}</h2>}
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    )}
    {children}
  </div>
);

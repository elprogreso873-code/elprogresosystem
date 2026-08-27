export const Spinner = ({ className = 'w-8 h-8' }) => (
  <div className="flex justify-center items-center py-12">
    <div
      className={`${className} border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin`}
      role="status"
      aria-label="Cargando"
    />
  </div>
);

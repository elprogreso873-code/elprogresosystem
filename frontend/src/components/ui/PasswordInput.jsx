import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { fieldBase, fieldSizes, fieldError, fieldNormal } from './fieldStyles';

export const PasswordInput = ({
  label = 'Contraseña',
  hint,
  error,
  id = 'contrasena',
  size = 'lg',
  className = '',
  ...props
}) => {
  const [visible, setVisible] = useState(false);
  const sizeClass = fieldSizes[size] || fieldSizes.lg;
  const borderClass = error ? fieldError : fieldNormal;

  return (
    <div className="w-full min-w-0">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`${fieldBase} ${sizeClass} ${borderClass} pl-4 pr-12 ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          tabIndex={-1}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      {hint && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
};

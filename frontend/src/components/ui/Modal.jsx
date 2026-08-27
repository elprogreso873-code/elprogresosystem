import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  footerClassName = '',
  stickyFooter = false,
  zIndex = 50,
  portal = true,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-6xl',
  };

  const panelClass = `modal-sheet w-full flex flex-col bg-white rounded-2xl shadow-2xl ${sizes[size] || sizes.md}`;

  const bodyClass = `px-5 sm:px-6 py-4 sm:py-5 overflow-y-auto overscroll-contain flex-1 min-h-0 ${
    stickyFooter && footer ? 'pb-2 sm:pb-5' : ''
  }`;

  const footerClass = `flex flex-col-reverse sm:flex-row sm:justify-end gap-3 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 bg-slate-50/80 shrink-0 ${
    stickyFooter
      ? 'shadow-[0_-4px_20px_rgba(15,23,42,0.08)] sm:shadow-none'
      : ''
  } rounded-b-2xl ${footerClassName}`;

  const panel = (
    <div
      className={panelClass}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="shrink-0 flex justify-center pt-2 pb-1 sm:hidden" aria-hidden="true">
        <span className="h-1 w-10 rounded-full bg-slate-200" />
      </div>

      <div className="flex items-center justify-between px-5 sm:px-6 py-3 sm:py-4 border-b border-slate-100 shrink-0">
        <h3 className="text-lg font-semibold text-slate-800 pr-3 leading-tight">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar" className="shrink-0">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className={bodyClass}>{children}</div>

      {footer && <div className={footerClass}>{footer}</div>}
    </div>
  );

  const content = (
    <div className="fixed inset-0 sm:flex sm:items-center sm:justify-center sm:p-4" style={{ zIndex }}>
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {panel}
    </div>
  );

  if (portal && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};

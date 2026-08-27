import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Package } from 'lucide-react';
import { Button } from '../ui/Button';

export const ProductImageLightbox = ({
  isOpen,
  onClose,
  src,
  alt = 'Producto',
  subtitle,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div
        className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 flex flex-col items-center max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Cerrar vista ampliada"
          className="absolute -top-2 -right-2 sm:top-0 sm:right-0 z-20 !bg-white/90 hover:!bg-white shadow-md"
        >
          <X className="w-5 h-5 text-slate-700" />
        </Button>

        <div className="rounded-2xl overflow-hidden bg-white shadow-2xl border border-slate-200/80">
          {src ? (
            <img
              src={src}
              alt={alt}
              className="block max-h-[min(78dvh,720px)] max-w-[min(92vw,640px)] w-auto h-auto object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-16 bg-slate-50 text-slate-400 min-w-[240px]">
              <Package className="w-16 h-16" />
              <p className="text-sm">Sin imagen</p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center max-w-lg px-2">
          <p className="text-white font-semibold text-lg leading-snug">{alt}</p>
          {subtitle && <p className="text-slate-300 text-sm mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};

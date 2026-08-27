import { useState } from 'react';
import { Package, ZoomIn } from 'lucide-react';
import { ProductImageLightbox } from './ProductImageLightbox';

const sizes = {
  xs: 'h-9 w-9 rounded-lg',
  sm: 'h-11 w-11 rounded-xl',
  md: 'h-14 w-14 rounded-xl',
  lg: 'h-16 w-16 rounded-2xl',
};

export const ProductImage = ({
  src,
  alt = 'Producto',
  size = 'sm',
  className = '',
  enlargeable = false,
  enlargeSubtitle,
}) => {
  const [failed, setFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const sizeClass = sizes[size] || sizes.sm;
  const canEnlarge = enlargeable && src && !failed;

  const openLightbox = (e) => {
    if (!canEnlarge) return;
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setLightboxOpen(true);
  };

  if (!src || failed) {
    return (
      <span
        className={`${sizeClass} shrink-0 flex items-center justify-center bg-slate-100 text-slate-400 border border-slate-200 ${className}`}
        aria-hidden
      >
        <Package className={size === 'xs' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5'} />
      </span>
    );
  }

  const interactiveClass = canEnlarge
    ? 'cursor-zoom-in hover:ring-2 hover:ring-brand-400/60 hover:ring-offset-1 transition-shadow group/img relative'
    : '';

  return (
    <>
      {canEnlarge ? (
        <button
          type="button"
          onClick={openLightbox}
          onPointerDown={(e) => e.stopPropagation()}
          className={`${sizeClass} shrink-0 p-0 border-0 bg-transparent ${interactiveClass} ${className}`}
          aria-label={`Ver imagen ampliada de ${alt}`}
        >
          <img
            src={src}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className={`${sizeClass} object-cover bg-white border border-slate-200 pointer-events-none`}
          />
          <span className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-slate-900/0 group-hover/img:bg-slate-900/25 transition-colors">
            <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover/img:opacity-100 drop-shadow-md transition-opacity" />
          </span>
        </button>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`${sizeClass} shrink-0 object-cover bg-white border border-slate-200 ${className}`}
        />
      )}

      {canEnlarge && (
        <ProductImageLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          src={src}
          alt={alt}
          subtitle={enlargeSubtitle}
        />
      )}
    </>
  );
};

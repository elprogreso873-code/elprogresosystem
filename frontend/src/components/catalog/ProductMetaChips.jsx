import { Palette, Ruler } from 'lucide-react';

export const ProductMetaChips = ({ color, talle, className = '' }) => {
  if (!color && !talle) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {color && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-violet-50 text-violet-800 border border-violet-100">
          <Palette className="w-3 h-3 shrink-0" />
          {color}
        </span>
      )}
      {talle && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-100">
          <Ruler className="w-3 h-3 shrink-0" />
          {talle}
        </span>
      )}
    </div>
  );
};

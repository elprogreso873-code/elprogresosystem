import { Package } from 'lucide-react';
import { BRAND_NAME } from '../../config/brand';

export const Logo = ({ size = 'md', showText = true, theme = 'dark' }) => {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-lg' },
    md: { icon: 'w-10 h-10', text: 'text-xl' },
    lg: { icon: 'w-14 h-14', text: 'text-2xl' },
  };

  const s = sizes[size] || sizes.md;
  const textColor = theme === 'light' ? 'text-white' : 'text-slate-800';

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`${s.icon} shrink-0 flex items-center justify-center rounded-xl bg-brand-500 text-white shadow-md`}
      >
        <Package className="w-[55%] h-[55%]" strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={`${s.text} font-bold tracking-tight truncate ${textColor}`}>
          {BRAND_NAME}
        </span>
      )}
    </div>
  );
};

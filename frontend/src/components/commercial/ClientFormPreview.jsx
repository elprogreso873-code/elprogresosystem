import { Eye, User, ShoppingCart, BookOpen } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { TIPOS_DOCUMENTO } from '../../constants/permissions';

const docLabel = (tipo) =>
  TIPOS_DOCUMENTO.find((t) => t.value === tipo)?.label || tipo || '—';

const initials = (nombre) => {
  const parts = (nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const ClientFormPreview = ({ client }) => {
  const {
    nombre,
    tipo_documento,
    numero_documento,
    telefono,
    email,
    direccion,
    estado,
    limite_credito,
  } = client;

  const displayName = nombre?.trim() || 'Nombre del cliente';
  const docText = numero_documento?.trim()
    ? `${tipo_documento || 'CF'} ${numero_documento}`
    : docLabel(tipo_documento);
  const contact = telefono?.trim() || email?.trim() || 'Sin contacto';
  const limite = limite_credito != null && limite_credito !== '' ? Number(limite_credito) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <Eye className="w-4 h-4 text-brand-600" />
        Vista previa en vivo
      </div>

      <div className="rounded-2xl border border-brand-200/80 bg-gradient-to-br from-slate-50 to-brand-50/30 p-4 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-brand-100 text-brand-800 font-bold text-sm flex items-center justify-center shrink-0">
            {initials(displayName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{displayName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{docText}</p>
            <p className="text-xs text-slate-400 mt-1 truncate">{contact}</p>
          </div>
          <Badge variant={estado || 'activo'} className="shrink-0 text-[10px]">
            {estado || 'activo'}
          </Badge>
        </div>

        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            En ventas
          </p>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 text-sm truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{docText}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Cuenta corriente
          </p>
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Límite crédito</span>
              <span className="font-medium text-slate-800 tabular-nums">
                {limite != null && !Number.isNaN(limite) ? formatCurrency(limite) : 'Sin límite'}
              </span>
            </div>
            {direccion?.trim() && (
              <p className="text-xs text-slate-500 pt-1 border-t border-slate-100 truncate">
                {direccion.trim()}
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        La vista se actualiza automáticamente mientras completa los campos.
      </p>
    </div>
  );
};

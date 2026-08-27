import { Badge } from '../ui/Badge';

const roleLabels = {
  admin: 'Admin',
  empleado: 'Empleado',
};

export const SidebarUser = ({ nombreUsuario, rol }) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-700/35 border border-slate-600/40">
    <span
      className="text-sm font-medium text-white truncate min-w-0"
      title={nombreUsuario}
    >
      {nombreUsuario}
    </span>
    <Badge
      variant={rol === 'admin' ? 'admin' : 'empleado'}
      className="shrink-0 capitalize !text-[11px] !px-2 !py-0.5"
    >
      {roleLabels[rol] || rol}
    </Badge>
  </div>
);

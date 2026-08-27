import { useAuthStore } from '../store/authStore';
import { ROLES } from '../constants/permissions';

export const usePermissions = () => {
  const user = useAuthStore((s) => s.user);
  const permisos = user?.permisos ?? [];
  const isAdmin = user?.rol === ROLES.ADMIN;

  const hasPermission = (...codes) => {
    if (isAdmin) return true;
    if (!codes.length) return true;
    return codes.some((code) => permisos.includes(code));
  };

  const hasAllPermissions = (...codes) => {
    if (isAdmin) return true;
    return codes.every((code) => permisos.includes(code));
  };

  return {
    user,
    permisos,
    isAdmin,
    isEmpleado: user?.rol === ROLES.EMPLEADO,
    hasPermission,
    hasAllPermissions,
  };
};

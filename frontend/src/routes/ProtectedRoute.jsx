import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const PermissionRoute = ({ permissions = [], requireAll = false }) => {
  const { hasPermission, hasAllPermissions } = usePermissions();

  const allowed = requireAll
    ? hasAllPermissions(...permissions)
    : hasPermission(...permissions);

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

/** Envuelve una página concreta (ruta con element=) — evita 404 en React Router 7 */
export const RequirePermission = ({
  permissions = [],
  requireAll = false,
  children,
}) => {
  const { hasPermission, hasAllPermissions } = usePermissions();

  const allowed = requireAll
    ? hasAllPermissions(...permissions)
    : hasPermission(...permissions);

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const DashboardRoute = () => (
  <PermissionRoute permissions={[PERMISSIONS.DASHBOARD_VER]} />
);

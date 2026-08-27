import { Routes, Route, Navigate } from 'react-router-dom';
import { ClientsPage } from '../pages/ClientsPage';
import { AccountCurrentPage } from '../pages/AccountCurrentPage';
import { AccountClientPage } from '../pages/AccountClientPage';
import { RequirePermission } from './ProtectedRoute';
import { PERMISSIONS } from '../constants/permissions';

const clientPerms = [
  PERMISSIONS.CLIENTES_VER,
  PERMISSIONS.CLIENTES_CREAR,
  PERMISSIONS.CLIENTES_EDITAR,
  PERMISSIONS.CLIENTES_DESACTIVAR,
];

const accountPerms = [
  PERMISSIONS.CUENTA_CORRIENTE_VER,
  PERMISSIONS.CUENTA_CORRIENTE_COBRAR,
  PERMISSIONS.CUENTA_CORRIENTE_AJUSTAR,
  PERMISSIONS.CLIENTES_VER,
];

export const ClientesRoutes = () => (
  <Routes>
    <Route index element={<Navigate to="listado" replace />} />
    <Route
      path="listado"
      element={
        <RequirePermission permissions={clientPerms}>
          <ClientsPage />
        </RequirePermission>
      }
    />
    <Route
      path="cuenta-corriente"
      element={
        <RequirePermission permissions={accountPerms}>
          <AccountCurrentPage />
        </RequirePermission>
      }
    />
    <Route
      path="cuenta-corriente/:clienteId"
      element={
        <RequirePermission permissions={accountPerms}>
          <AccountClientPage />
        </RequirePermission>
      }
    />
    <Route path="*" element={<Navigate to="listado" replace />} />
  </Routes>
);

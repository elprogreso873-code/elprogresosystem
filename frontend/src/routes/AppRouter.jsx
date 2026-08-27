import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { UsersPage } from '../pages/UsersPage';
import { PermissionsPage } from '../pages/PermissionsPage';
import { PaymentMethodsConfigPage } from '../pages/PaymentMethodsConfigPage';
import { CategoriesPage } from '../pages/CategoriesPage';
import { ProductsPage } from '../pages/ProductsPage';
import { InventoryPage } from '../pages/InventoryPage';
import { StockAlertsPage } from '../pages/StockAlertsPage';
import { SalesPage } from '../pages/SalesPage';
import { SaleCreatePage } from '../pages/SaleCreatePage';
import { SaleDetailPage } from '../pages/SaleDetailPage';
import { QuotesPage } from '../pages/QuotesPage';
import { QuoteCreatePage } from '../pages/QuoteCreatePage';
import { QuoteDetailPage } from '../pages/QuoteDetailPage';
import { CashPage } from '../pages/CashPage';
import { CashSessionsPage } from '../pages/CashSessionsPage';
import { CashSessionDetailPage } from '../pages/CashSessionDetailPage';
import { ReceiptsPage } from '../pages/ReceiptsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { AuditPage } from '../pages/AuditPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RouterErrorPage } from '../pages/RouterErrorPage';
import { ClientesRoutes } from './ClientesRoutes';
import {
  ProtectedRoute,
  PublicRoute,
  PermissionRoute,
  DashboardRoute,
  RequirePermission,
} from './ProtectedRoute';
import { PERMISSIONS, CLIENTES_ACCESS_PERMISSIONS } from '../constants/permissions';

const LegacyVentaDetailRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/ventas/${id}`} replace />;
};

const catalogPerms = [
  PERMISSIONS.CATEGORIAS_VER,
  PERMISSIONS.CATEGORIAS_CREAR,
  PERMISSIONS.CATEGORIAS_EDITAR,
  PERMISSIONS.CATEGORIAS_DESACTIVAR,
];

const productPerms = [
  PERMISSIONS.PRODUCTOS_VER,
  PERMISSIONS.PRODUCTOS_CREAR,
  PERMISSIONS.PRODUCTOS_EDITAR,
  PERMISSIONS.PRODUCTOS_DESACTIVAR,
];

const inventoryPerms = [PERMISSIONS.INVENTARIO_VER, PERMISSIONS.INVENTARIO_MOVIMIENTO];

const stockAlertsPerms = [
  PERMISSIONS.INVENTARIO_VER,
  PERMISSIONS.PRODUCTOS_VER,
  PERMISSIONS.REPORTES_VER,
];

const salesPerms = [
  PERMISSIONS.VENTAS_VER,
  PERMISSIONS.VENTAS_CREAR,
  PERMISSIONS.VENTAS_ANULAR,
];

const quotesPerms = [
  PERMISSIONS.PRESUPUESTOS_VER,
  PERMISSIONS.PRESUPUESTOS_CREAR,
  PERMISSIONS.PRESUPUESTOS_ANULAR,
  PERMISSIONS.PRESUPUESTOS_CONVERTIR,
];

const cashPerms = [
  PERMISSIONS.CAJA_VER,
  PERMISSIONS.CAJA_ABRIR,
  PERMISSIONS.CAJA_CERRAR,
  PERMISSIONS.CAJA_MOVIMIENTO,
];

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/usuarios" element={<Navigate to="/configuracion/usuarios" replace />} />

      <Route element={<PublicRoute />} errorElement={<RouterErrorPage />}>
        <Route element={<AuthLayout />} errorElement={<RouterErrorPage />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />} errorElement={<RouterErrorPage />}>
        <Route element={<DashboardLayout />} errorElement={<RouterErrorPage />}>
          <Route element={<DashboardRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          <Route element={<PermissionRoute permissions={salesPerms} />}>
            <Route path="/ventas" element={<SalesPage />} />
            <Route path="/ventas/nueva" element={<SaleCreatePage />} />
            <Route path="/ventas/:id" element={<SaleDetailPage />} />
          </Route>

          <Route element={<PermissionRoute permissions={quotesPerms} />}>
            <Route path="/presupuestos" element={<QuotesPage />} />
            <Route path="/presupuestos/nuevo" element={<QuoteCreatePage />} />
            <Route path="/presupuestos/:id" element={<QuoteDetailPage />} />
          </Route>

          <Route element={<PermissionRoute permissions={cashPerms} />}>
            <Route path="/caja" element={<CashPage />} />
            <Route path="/caja/historial" element={<CashSessionsPage />} />
            <Route path="/caja/historial/:id" element={<CashSessionDetailPage />} />
          </Route>

          <Route path="/comercial/ventas" element={<Navigate to="/ventas" replace />} />
          <Route path="/comercial/ventas/nueva" element={<Navigate to="/ventas/nueva" replace />} />
          <Route path="/comercial/ventas/:id" element={<LegacyVentaDetailRedirect />} />
          <Route path="/finanzas/caja" element={<Navigate to="/caja" replace />} />
          <Route path="/comercial/clientes" element={<Navigate to="/clientes/listado" replace />} />
          <Route path="/comercial" element={<Navigate to="/clientes/listado" replace />} />

          <Route element={<PermissionRoute permissions={catalogPerms} />}>
            <Route path="/catalogo/categorias" element={<CategoriesPage />} />
          </Route>
          <Route element={<PermissionRoute permissions={productPerms} />}>
            <Route path="/catalogo/productos" element={<ProductsPage />} />
          </Route>
          <Route element={<PermissionRoute permissions={inventoryPerms} />}>
            <Route path="/catalogo/inventario" element={<InventoryPage />} />
          </Route>
          <Route element={<PermissionRoute permissions={stockAlertsPerms} />}>
            <Route path="/catalogo/alertas-stock" element={<StockAlertsPage />} />
          </Route>
          <Route
            path="/comercial/inventario"
            element={<Navigate to="/catalogo/inventario" replace />}
          />

          {/* Clientes: rutas anidadas compatibles con React Router 7 */}
          <Route
            path="/clientes/*"
            element={
              <RequirePermission permissions={CLIENTES_ACCESS_PERMISSIONS}>
                <ClientesRoutes />
              </RequirePermission>
            }
          />

          <Route element={<PermissionRoute permissions={[PERMISSIONS.COMPROBANTES_VER]} />}>
            <Route path="/finanzas/comprobantes" element={<ReceiptsPage />} />
          </Route>
          <Route element={<PermissionRoute permissions={[PERMISSIONS.REPORTES_VER]} />}>
            <Route path="/finanzas/reportes" element={<ReportsPage />} />
          </Route>
          <Route element={<PermissionRoute permissions={[PERMISSIONS.AUDITORIA_VER]} />}>
            <Route path="/finanzas/auditoria" element={<AuditPage />} />
          </Route>

          <Route
            element={
              <PermissionRoute
                permissions={[
                  PERMISSIONS.USUARIOS_VER,
                  PERMISSIONS.USUARIOS_CREAR,
                  PERMISSIONS.USUARIOS_EDITAR,
                  PERMISSIONS.USUARIOS_DESACTIVAR,
                ]}
              />
            }
          >
            <Route path="/configuracion/usuarios" element={<UsersPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute
                permissions={[PERMISSIONS.PERMISOS_VER, PERMISSIONS.PERMISOS_ASIGNAR]}
              />
            }
          >
            <Route path="/configuracion/permisos" element={<PermissionsPage />} />
          </Route>
          <Route
            element={
              <PermissionRoute permissions={[PERMISSIONS.METODOS_PAGO_GESTIONAR]} />
            }
          >
            <Route
              path="/configuracion/metodos-pago"
              element={<PaymentMethodsConfigPage />}
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

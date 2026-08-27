import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  Users,
  Shield,
  ChevronDown,
  Tags,
  Package,
  LayoutGrid,
  UserCircle,
  Warehouse,
  AlertTriangle,
  ShoppingCart,
  ClipboardList,
  Wallet,
  BarChart3,
  ScrollText,
  FileText,
  CreditCard,
  Landmark,
  BookOpen,
  List,
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import {
  PERMISSIONS,
  CONFIG_ACCESS_PERMISSIONS,
  CATALOGO_ACCESS_PERMISSIONS,
  CLIENTES_ACCESS_PERMISSIONS,
  FINANZAS_ACCESS_PERMISSIONS,
} from '../../constants/permissions';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
    isActive
      ? 'bg-brand-500 text-white shadow-md'
      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
  }`;

const subLinkClass = ({ isActive }) =>
  `flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-xl text-sm transition-colors ${
    isActive
      ? 'bg-brand-500/90 text-white font-medium'
      : 'text-slate-400 hover:bg-slate-700/40 hover:text-white'
  }`;

export const SidebarNav = ({ onNavigate }) => {
  const { hasPermission } = usePermissions();
  const location = useLocation();
  const isConfigPath = location.pathname.startsWith('/configuracion');
  const isCatalogoPath = location.pathname.startsWith('/catalogo');
  const isClientesPath = location.pathname.startsWith('/clientes');
  const isFinanzasPath = location.pathname.startsWith('/finanzas');
  const [configOpen, setConfigOpen] = useState(isConfigPath);
  const [catalogoOpen, setCatalogoOpen] = useState(isCatalogoPath);
  const [clientesOpen, setClientesOpen] = useState(isClientesPath);
  const [finanzasOpen, setFinanzasOpen] = useState(isFinanzasPath);

  const showConfig = hasPermission(...CONFIG_ACCESS_PERMISSIONS);
  const showCatalogo = hasPermission(...CATALOGO_ACCESS_PERMISSIONS);
  const showClientes = hasPermission(...CLIENTES_ACCESS_PERMISSIONS);
  const showFinanzas = hasPermission(...FINANZAS_ACCESS_PERMISSIONS);

  const showUsers = hasPermission(
    PERMISSIONS.USUARIOS_VER,
    PERMISSIONS.USUARIOS_CREAR,
    PERMISSIONS.USUARIOS_EDITAR,
    PERMISSIONS.USUARIOS_DESACTIVAR
  );
  const showPermissions = hasPermission(
    PERMISSIONS.PERMISOS_VER,
    PERMISSIONS.PERMISOS_ASIGNAR
  );
  const showPaymentMethods = hasPermission(PERMISSIONS.METODOS_PAGO_GESTIONAR);
  const showCategories = hasPermission(
    PERMISSIONS.CATEGORIAS_VER,
    PERMISSIONS.CATEGORIAS_CREAR,
    PERMISSIONS.CATEGORIAS_EDITAR,
    PERMISSIONS.CATEGORIAS_DESACTIVAR
  );
  const showProducts = hasPermission(
    PERMISSIONS.PRODUCTOS_VER,
    PERMISSIONS.PRODUCTOS_CREAR,
    PERMISSIONS.PRODUCTOS_EDITAR,
    PERMISSIONS.PRODUCTOS_DESACTIVAR
  );
  const showStockAlerts = hasPermission(
    PERMISSIONS.INVENTARIO_VER,
    PERMISSIONS.PRODUCTOS_VER,
    PERMISSIONS.REPORTES_VER
  );
  const showClientsList = hasPermission(
    PERMISSIONS.CLIENTES_VER,
    PERMISSIONS.CLIENTES_CREAR,
    PERMISSIONS.CLIENTES_EDITAR,
    PERMISSIONS.CLIENTES_DESACTIVAR
  );
  const showAccountCurrent = hasPermission(
    PERMISSIONS.CUENTA_CORRIENTE_VER,
    PERMISSIONS.CUENTA_CORRIENTE_COBRAR,
    PERMISSIONS.CLIENTES_VER
  );
  const showInventory = hasPermission(
    PERMISSIONS.INVENTARIO_VER,
    PERMISSIONS.INVENTARIO_MOVIMIENTO
  );
  const showSales = hasPermission(
    PERMISSIONS.VENTAS_VER,
    PERMISSIONS.VENTAS_CREAR,
    PERMISSIONS.VENTAS_ANULAR
  );
  const showQuotes = hasPermission(
    PERMISSIONS.PRESUPUESTOS_VER,
    PERMISSIONS.PRESUPUESTOS_CREAR,
    PERMISSIONS.PRESUPUESTOS_ANULAR,
    PERMISSIONS.PRESUPUESTOS_CONVERTIR
  );
  const showCash = hasPermission(
    PERMISSIONS.CAJA_VER,
    PERMISSIONS.CAJA_ABRIR,
    PERMISSIONS.CAJA_CERRAR,
    PERMISSIONS.CAJA_MOVIMIENTO
  );
  const showReceipts = hasPermission(PERMISSIONS.COMPROBANTES_VER);
  const showReports = hasPermission(PERMISSIONS.REPORTES_VER);
  const showAudit = hasPermission(PERMISSIONS.AUDITORIA_VER);

  const handleClick = () => onNavigate?.();

  if (!hasPermission(PERMISSIONS.DASHBOARD_VER)) {
    return (
      <nav className="flex-1 px-3 py-4">
        <p className="px-4 text-sm text-slate-400">Sin módulos asignados</p>
      </nav>
    );
  }

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      <NavLink to="/dashboard" end className={linkClass} onClick={handleClick}>
        <LayoutDashboard className="w-5 h-5 shrink-0" />
        Dashboard
      </NavLink>

      {showSales && (
        <NavLink to="/ventas" className={linkClass} onClick={handleClick}>
          <ShoppingCart className="w-5 h-5 shrink-0" />
          Ventas
        </NavLink>
      )}

      {showQuotes && (
        <NavLink to="/presupuestos" className={linkClass} onClick={handleClick}>
          <ClipboardList className="w-5 h-5 shrink-0" />
          Presupuestos
        </NavLink>
      )}

      {showCash && (
        <NavLink to="/caja" className={linkClass} onClick={handleClick}>
          <Wallet className="w-5 h-5 shrink-0" />
          Caja
        </NavLink>
      )}

      {showCatalogo && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setCatalogoOpen((o) => !o)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isCatalogoPath
                ? 'text-brand-400 bg-slate-700/30'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-left">Catálogo</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${catalogoOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {catalogoOpen && (
            <div className="mt-1 space-y-0.5">
              {showCategories && (
                <NavLink
                  to="/catalogo/categorias"
                  className={subLinkClass}
                  onClick={handleClick}
                >
                  <Tags className="w-4 h-4 shrink-0" />
                  Categorías
                </NavLink>
              )}
              {showProducts && (
                <NavLink
                  to="/catalogo/productos"
                  className={subLinkClass}
                  onClick={handleClick}
                >
                  <Package className="w-4 h-4 shrink-0" />
                  Productos
                </NavLink>
              )}
              {showInventory && (
                <NavLink
                  to="/catalogo/inventario"
                  className={subLinkClass}
                  onClick={handleClick}
                >
                  <Warehouse className="w-4 h-4 shrink-0" />
                  Inventario
                </NavLink>
              )}
              {showStockAlerts && (
                <NavLink
                  to="/catalogo/alertas-stock"
                  className={subLinkClass}
                  onClick={handleClick}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Alertas de stock
                </NavLink>
              )}
            </div>
          )}
        </div>
      )}

      {showClientes && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setClientesOpen((o) => !o)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isClientesPath
                ? 'text-brand-400 bg-slate-700/30'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <UserCircle className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-left">Clientes</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${clientesOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {clientesOpen && (
            <div className="mt-1 space-y-0.5">
              {showClientsList && (
                <NavLink
                  to="/clientes/listado"
                  className={subLinkClass}
                  onClick={handleClick}
                >
                  <List className="w-4 h-4 shrink-0" />
                  Listado de clientes
                </NavLink>
              )}
              {showAccountCurrent && (
                <NavLink
                  to="/clientes/cuenta-corriente"
                  className={subLinkClass}
                  onClick={handleClick}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  Cuenta corrientes
                </NavLink>
              )}
            </div>
          )}
        </div>
      )}

      {showFinanzas && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setFinanzasOpen((o) => !o)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isFinanzasPath
                ? 'text-brand-400 bg-slate-700/30'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <Landmark className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-left">Finanzas</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${finanzasOpen ? 'rotate-180' : ''}`} />
          </button>
          {finanzasOpen && (
            <div className="mt-1 space-y-0.5">
              {showReceipts && (
                <NavLink to="/finanzas/comprobantes" className={subLinkClass} onClick={handleClick}>
                  <FileText className="w-4 h-4 shrink-0" />
                  Comprobantes
                </NavLink>
              )}
              {showReports && (
                <NavLink to="/finanzas/reportes" className={subLinkClass} onClick={handleClick}>
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  Reportes
                </NavLink>
              )}
              {showAudit && (
                <NavLink to="/finanzas/auditoria" className={subLinkClass} onClick={handleClick}>
                  <ScrollText className="w-4 h-4 shrink-0" />
                  Auditoría
                </NavLink>
              )}
            </div>
          )}
        </div>
      )}

      {showConfig && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setConfigOpen((o) => !o)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isConfigPath
                ? 'text-brand-400 bg-slate-700/30'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="flex-1 text-left">Configuración</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${configOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {configOpen && (
            <div className="mt-1 space-y-0.5">
              {showUsers && (
                <NavLink
                  to="/configuracion/usuarios"
                  className={subLinkClass}
                  onClick={handleClick}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  Usuarios
                </NavLink>
              )}
              {showPermissions && (
                <NavLink
                  to="/configuracion/permisos"
                  className={subLinkClass}
                  onClick={handleClick}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  Permisos
                </NavLink>
              )}
              {showPaymentMethods && (
                <NavLink
                  to="/configuracion/metodos-pago"
                  className={subLinkClass}
                  onClick={handleClick}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  Métodos de pago
                </NavLink>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

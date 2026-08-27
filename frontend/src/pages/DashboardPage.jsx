import {
  Users,
  Package,
  Tags,
  ShoppingCart,
  UserCircle,
  Warehouse,
  Shield,
  Wallet,
  BarChart3,
  FileText,
  BookOpen,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { ProductQuickSearch } from '../components/dashboard/ProductQuickSearch';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();

  const quickLinks = [
    hasPermission(PERMISSIONS.VENTAS_VER, PERMISSIONS.VENTAS_CREAR) && {
      title: 'Ventas',
      icon: ShoppingCart,
      to: '/ventas',
      color: 'bg-emerald-100 text-emerald-800',
    },
    hasPermission(PERMISSIONS.CAJA_VER, PERMISSIONS.CAJA_ABRIR) && {
      title: 'Caja',
      icon: Wallet,
      to: '/caja',
      color: 'bg-violet-100 text-violet-800',
    },
    hasPermission(PERMISSIONS.CATEGORIAS_VER, PERMISSIONS.CATEGORIAS_CREAR) && {
      title: 'Categorías',
      icon: Tags,
      to: '/catalogo/categorias',
      color: 'bg-brand-100 text-brand-700',
    },
    hasPermission(PERMISSIONS.PRODUCTOS_VER, PERMISSIONS.PRODUCTOS_CREAR) && {
      title: 'Productos',
      icon: Package,
      to: '/catalogo/productos',
      color: 'bg-amber-100 text-amber-800',
    },
    hasPermission(PERMISSIONS.INVENTARIO_VER, PERMISSIONS.INVENTARIO_MOVIMIENTO) && {
      title: 'Inventario',
      icon: Warehouse,
      to: '/catalogo/inventario',
      color: 'bg-slate-200 text-slate-700',
    },
    hasPermission(PERMISSIONS.CLIENTES_VER, PERMISSIONS.CLIENTES_CREAR) && {
      title: 'Clientes',
      icon: UserCircle,
      to: '/clientes/listado',
      color: 'bg-blue-100 text-blue-800',
    },
    hasPermission(PERMISSIONS.CUENTA_CORRIENTE_VER, PERMISSIONS.CUENTA_CORRIENTE_COBRAR) && {
      title: 'Cuenta corriente',
      icon: BookOpen,
      to: '/clientes/cuenta-corriente',
      color: 'bg-amber-100 text-amber-800',
    },
    hasPermission(PERMISSIONS.COMPROBANTES_VER) && {
      title: 'Comprobantes',
      icon: FileText,
      to: '/finanzas/comprobantes',
      color: 'bg-slate-100 text-slate-700',
    },
    hasPermission(PERMISSIONS.REPORTES_VER) && {
      title: 'Reportes',
      icon: BarChart3,
      to: '/finanzas/reportes',
      color: 'bg-indigo-100 text-indigo-800',
    },
    hasPermission(PERMISSIONS.USUARIOS_VER) && {
      title: 'Usuarios',
      icon: Users,
      to: '/configuracion/usuarios',
      color: 'bg-slate-100 text-slate-600',
    },
    hasPermission(PERMISSIONS.PERMISOS_VER, PERMISSIONS.PERMISOS_ASIGNAR) && {
      title: 'Permisos',
      icon: Shield,
      to: '/configuracion/permisos',
      color: 'bg-slate-700 text-brand-400',
    },
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
          Bienvenido, {user?.nombre_usuario}
        </h1>
        <p className="text-slate-500 mt-1">
          Panel principal — consulta de productos, precios y accesos rápidos
        </p>
      </div>

      <ProductQuickSearch />

      {quickLinks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Accesos rápidos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickLinks.map(({ title, icon: Icon, to, color }) => (
              <Link key={title} to={to}>
                <Card className="!p-5 h-full hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-800 mt-4">{title}</h3>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

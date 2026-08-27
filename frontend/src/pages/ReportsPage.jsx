import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Users,
  Package,
  XCircle,
  Wallet,
  RefreshCw,
  FileSpreadsheet,
  FileDown,
} from 'lucide-react';
import { reportService } from '../services/reportService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/common/EmptyState';
import { CompactPeriodFilter } from '../components/common/CompactPeriodFilter';
import { getDefaultDateRange, getPresetRange, isValidDateRange } from '../utils/dateRange';
import { formatCurrency, formatNumber } from '../utils/formatCurrency';
import { formatDateOnly } from '../utils/formatDate';
import { getErrorMessage } from '../utils/getErrorMessage';
import { exportReportExcel, exportReportPdf } from '../utils/exportReport';

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-start gap-2">
    {Icon && <Icon className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />}
    <div>
      <h2 className="font-semibold text-slate-800">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

export const ReportsPage = () => {
  const defaultRange = getDefaultDateRange();
  const [fechaDesde, setFechaDesde] = useState(defaultRange.fecha_desde);
  const [fechaHasta, setFechaHasta] = useState(defaultRange.fecha_hasta);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [salesByDay, setSalesByDay] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [salesByUser, setSalesByUser] = useState([]);
  const [exporting, setExporting] = useState(null);

  const loadReports = useCallback(async () => {
    if (!isValidDateRange(fechaDesde, fechaHasta)) {
      setError('El rango de fechas no es válido');
      return;
    }

    const params = { fecha_desde: fechaDesde, fecha_hasta: fechaHasta };
    setLoading(true);
    setError('');
    try {
      const [dash, byDay, top, stock, byUser] = await Promise.all([
        reportService.dashboard(params),
        reportService.salesByDay(params),
        reportService.topProducts({ ...params, limit: 8 }),
        reportService.lowStock(),
        reportService.salesByUser(params),
      ]);
      setDashboard(dash);
      setSalesByDay(byDay);
      setTopProducts(top);
      setLowStock(stock);
      setSalesByUser(byUser);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handlePresetSelect = (presetId) => {
    if (presetId === 'custom') return;
    const range = getPresetRange(presetId);
    setFechaDesde(range.fecha_desde);
    setFechaHasta(range.fecha_hasta);
  };

  const maxDayTotal = Math.max(...salesByDay.map((d) => d.total), 1);
  const maxUserTotal = Math.max(...salesByUser.map((u) => u.total), 1);

  const exportPayload = {
    fechaDesde,
    fechaHasta,
    dashboard,
    salesByDay,
    topProducts,
    salesByUser,
    lowStock,
  };

  const handleExportExcel = async () => {
    if (!dashboard) return;
    setExporting('excel');
    try {
      await exportReportExcel(exportPayload);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (!dashboard) return;
    setExporting('pdf');
    try {
      await exportReportPdf(exportPayload);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-brand-600" />
            Reportes
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Ventas, ingresos, productos e inventario según el período
          </p>
        </div>
        {dashboard && !loading && (
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <TrendingUp className="w-4 h-4 text-brand-600 shrink-0" />
            <span className="tabular-nums">
              <strong className="text-slate-800">{formatCurrency(dashboard.ventas.ingresos)}</strong>{' '}
              en el período
            </span>
          </div>
        )}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
            <CompactPeriodFilter
              fechaDesde={fechaDesde}
              fechaHasta={fechaHasta}
              onDesdeChange={setFechaDesde}
              onHastaChange={setFechaHasta}
              onPresetSelect={handlePresetSelect}
              loading={loading}
            />
            <div className="flex flex-wrap gap-2 shrink-0 sm:self-center">
              <Button
                variant="outline"
                onClick={handleExportExcel}
                disabled={loading || exporting || !dashboard}
                className="h-11"
                aria-label="Exportar Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPdf}
                disabled={loading || exporting || !dashboard}
                className="h-11"
                aria-label="Exportar PDF"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              <Button
                variant="outline"
                onClick={loadReports}
                disabled={loading || !isValidDateRange(fechaDesde, fechaHasta)}
                className="h-11"
                aria-label="Actualizar reporte"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {error && <Alert>{error}</Alert>}

      {loading && !dashboard ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : null}

      {dashboard && (
        <div className={`space-y-6 ${loading ? 'opacity-60 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="!p-5 border-l-4 border-l-brand-500">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Ingresos del período
              </p>
              <p className="text-2xl font-bold text-brand-700 mt-1 tabular-nums">
                {formatCurrency(dashboard.ventas.ingresos)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {dashboard.ventas.cantidad} ventas completadas
              </p>
            </Card>
            <Card className="!p-5 border-l-4 border-l-emerald-500">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Receipt className="w-4 h-4" /> Ticket promedio
              </p>
              <p className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">
                {formatCurrency(dashboard.ventas.ticket_promedio)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Por venta completada</p>
            </Card>
            <Card className="!p-5 border-l-4 border-l-amber-500">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Ventas anuladas
              </p>
              <p className="text-2xl font-bold text-amber-800 mt-1 tabular-nums">
                {dashboard.ventas.anuladas}
              </p>
              <p className="text-xs text-slate-500 mt-1">En el mismo período</p>
            </Card>
            <Card className="!p-5 border-l-4 border-l-red-400">
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Stock bajo
              </p>
              <p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">
                {dashboard.inventario.productos_stock_bajo}
              </p>
              <p className="text-xs text-slate-500 mt-1">Productos bajo mínimo</p>
            </Card>
          </div>

          {dashboard.por_metodo_pago?.length > 0 && (
            <Card className="!p-0 overflow-hidden">
              <SectionHeader
                icon={Wallet}
                title="Ingresos por método de pago"
                subtitle="Desglose del período seleccionado"
              />
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {dashboard.por_metodo_pago.map((m) => {
                  const share =
                    dashboard.ventas.ingresos > 0
                      ? Math.round((m.total / dashboard.ventas.ingresos) * 100)
                      : 0;
                  return (
                    <div
                      key={m.metodo_pago}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-200 transition-colors"
                    >
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {m.metodo_pago_nombre || m.metodo_pago}
                      </p>
                      <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
                        {formatCurrency(m.total)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {m.cantidad} operaciones · {share}%
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="!p-0 overflow-hidden">
              <SectionHeader icon={BarChart3} title="Ventas por día" subtitle="Evolución diaria" />
              <div className="px-4 sm:px-6 pb-6">
                {salesByDay.length === 0 ? (
                  <EmptyState
                    title="Sin ventas"
                    description="No hay ventas registradas en este período"
                  />
                ) : (
                  <div className="space-y-4">
                    {salesByDay.map((d) => (
                      <div key={d.fecha}>
                        <div className="flex justify-between items-baseline gap-2 text-sm mb-1.5">
                          <span className="font-medium text-slate-700">
                            {formatDateOnly(d.fecha)}
                          </span>
                          <span className="text-slate-600 tabular-nums shrink-0">
                            {formatCurrency(d.total)}{' '}
                            <span className="text-xs text-slate-400">({d.cantidad})</span>
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max((d.total / maxDayTotal) * 100, 4)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="!p-0 overflow-hidden">
              <SectionHeader
                icon={Package}
                title="Productos más vendidos"
                subtitle="Top 8 por ingresos"
              />
              <div className="px-4 sm:px-6 pb-6">
                {topProducts.length === 0 ? (
                  <EmptyState title="Sin datos" description="No hay productos vendidos en el período" />
                ) : (
                  <ul className="space-y-2">
                    {topProducts.map((p, i) => (
                      <li
                        key={p.producto_id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/80"
                      >
                        <span
                          className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                            i === 0
                              ? 'bg-brand-500 text-white'
                              : 'bg-brand-100 text-brand-800'
                          }`}
                        >
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{p.producto_nombre}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatNumber(p.cantidad_vendida, 2)} uds ·{' '}
                            {formatCurrency(p.ingresos)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="!p-0 overflow-hidden">
              <SectionHeader icon={Users} title="Ventas por vendedor" subtitle="Ranking del período" />
              <div className="px-4 sm:px-6 pb-6">
                {salesByUser.length === 0 ? (
                  <EmptyState title="Sin datos" description="No hay ventas por vendedor en el período" />
                ) : (
                  <div className="space-y-3">
                    {salesByUser.map((u) => (
                      <div key={u.usuario_id} className="space-y-1">
                        <div className="flex justify-between text-sm gap-2">
                          <span className="font-medium text-slate-800 truncate">{u.nombre_usuario}</span>
                          <span className="tabular-nums text-slate-700 shrink-0">
                            {formatCurrency(u.total)}{' '}
                            <span className="text-xs text-slate-400">({u.cantidad})</span>
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-600 rounded-full"
                            style={{
                              width: `${Math.max((u.total / maxUserTotal) * 100, 6)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="!p-0 overflow-hidden">
              <SectionHeader
                icon={AlertTriangle}
                title="Alertas de stock bajo"
                subtitle="Inventario actual (sin filtro de fecha)"
              />
              <div className="px-4 sm:px-6 pb-6">
                {lowStock.length === 0 ? (
                  <div className="text-sm text-emerald-700 py-8 text-center rounded-xl bg-emerald-50 border border-emerald-100">
                    Todos los productos con stock adecuado
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-72 overflow-y-auto overscroll-contain">
                    {lowStock.map((p) => (
                      <li
                        key={p.id}
                        className="flex justify-between items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100 text-sm"
                      >
                        <span className="font-medium text-slate-800 truncate">{p.nombre}</span>
                        <span className="text-amber-900 tabular-nums shrink-0 text-xs">
                          {formatNumber(p.stock, 2)} / {formatNumber(p.stock_minimo, 2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

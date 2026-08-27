import { useState, useMemo } from 'react';
import { ScrollText } from 'lucide-react';
import { auditService } from '../services/auditService';
import { useDebounce } from '../hooks/useDebounce';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { SearchInput } from '../components/ui/SearchInput';
import { FilterToolbar } from '../components/common/FilterToolbar';
import { CompactPeriodFilter } from '../components/common/CompactPeriodFilter';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate } from '../utils/formatDate';
import {
  getDefaultInventoryDateRange,
  getPresetRange,
  isValidDateRange,
} from '../utils/dateRange';

const MODULOS = [
  { value: 'todos', label: 'Todos los módulos' },
  { value: 'caja', label: 'Caja' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'usuarios', label: 'Usuarios' },
  { value: 'cuenta_corriente', label: 'Cuenta corriente' },
];

const AuditLogCard = ({ log }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-slate-800">{log.usuario_nombre || 'Sistema'}</p>
        <p className="text-xs text-slate-500 mt-0.5 capitalize">{log.modulo}</p>
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
        {formatDate(log.fecha)}
      </span>
    </div>
    <p className="font-mono text-xs text-brand-800 bg-brand-50/50 px-2 py-1 rounded-lg inline-block">
      {log.accion}
    </p>
    {log.detalle && (
      <p className="text-xs text-slate-600 break-all line-clamp-3">
        {JSON.stringify(log.detalle)}
      </p>
    )}
  </div>
);

export const AuditPage = () => {
  const defaultRange = getDefaultInventoryDateRange();
  const [modulo, setModulo] = useState('todos');
  const [accion, setAccion] = useState('');
  const [fechaDesde, setFechaDesde] = useState(defaultRange.fecha_desde);
  const [fechaHasta, setFechaHasta] = useState(defaultRange.fecha_hasta);
  const debouncedAccion = useDebounce(accion);
  const dateRangeValid = isValidDateRange(fechaDesde, fechaHasta);

  const listParams = useMemo(
    () => ({
      modulo,
      accion: debouncedAccion,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
    }),
    [modulo, debouncedAccion, fechaDesde, fechaHasta]
  );

  const {
    items: logs,
    pagination,
    loading,
    error,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { logs: data, pagination: pag } = await auditService.list({
        page,
        limit,
        ...params,
      });
      return { data, pagination: pag };
    },
    params: listParams,
    defaultLimit: 20,
    enabled: dateRangeValid,
  });

  const handlePresetSelect = (presetId) => {
    if (presetId === 'custom') return;
    const range = getPresetRange(presetId);
    setFechaDesde(range.fecha_desde);
    setFechaHasta(range.fecha_hasta);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ScrollText className="w-7 h-7 text-brand-600" />
            Auditoría
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Registro de acciones críticas del sistema
          </p>
        </div>
        {!loading && pagination.total > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <ScrollText className="w-4 h-4 text-brand-600 shrink-0" />
            <span>
              <strong className="text-slate-800 tabular-nums">{pagination.total}</strong> registro
              {pagination.total !== 1 ? 's' : ''} en el período
            </span>
          </div>
        )}
      </div>

      {!dateRangeValid && (
        <Alert>El rango de fechas no es válido</Alert>
      )}
      {error && <Alert>{error}</Alert>}

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 sm:p-6 space-y-3 border-b border-slate-100">
          <CompactPeriodFilter
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onDesdeChange={setFechaDesde}
            onHastaChange={setFechaHasta}
            onPresetSelect={handlePresetSelect}
            loading={loading}
          />

          <FilterToolbar
            onRefresh={refresh}
            search={
              <SearchInput
                id="audit-accion"
                label="Buscar acción"
                placeholder="Ej: venta.anular, caja.apertura…"
                value={accion}
                onChange={(e) => setAccion(e.target.value)}
              />
            }
            filters={[
              <Select
                key="modulo"
                id="mod-audit"
                label="Módulo"
                size="md"
                hidePlaceholder
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
                options={MODULOS}
              />,
            ]}
          />
        </div>

        <div className="px-4 sm:px-6 pb-6 pt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              title="Sin registros"
              description="No hay eventos de auditoría para el período y filtros seleccionados"
            />
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {logs.map((log) => (
                  <AuditLogCard key={log.id} log={log} />
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200">
                      <th className="px-4 py-3 text-left font-medium">Fecha</th>
                      <th className="px-4 py-3 text-left font-medium">Usuario</th>
                      <th className="px-4 py-3 text-left font-medium">Módulo</th>
                      <th className="px-4 py-3 text-left font-medium">Acción</th>
                      <th className="px-4 py-3 text-left font-medium">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-slate-100 hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                          {formatDate(log.fecha)}
                        </td>
                        <td className="px-4 py-3 text-slate-800">{log.usuario_nombre || 'Sistema'}</td>
                        <td className="px-4 py-3 capitalize text-slate-700">{log.modulo}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-800">{log.accion}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-md truncate">
                          {log.detalle ? JSON.stringify(log.detalle) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={pagination.page}
                limit={pagination.limit}
                total={pagination.total}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                onLimitChange={setLimit}
                itemLabel="registros"
              />
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

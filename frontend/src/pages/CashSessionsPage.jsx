import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import { cashService } from '../services/cashService';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';

export const CashSessionsPage = () => {
  const [estadoFilter, setEstadoFilter] = useState('todos');

  const listParams = useMemo(() => ({ estado: estadoFilter }), [estadoFilter]);

  const {
    items: sessions,
    pagination,
    loading,
    error,
    setPage,
    setLimit,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { sessions: data, pagination: pag } = await cashService.list({
        page,
        limit,
        ...params,
      });
      return { data, pagination: pag };
    },
    params: listParams,
    defaultLimit: 15,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to="/caja"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a caja
          </Link>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-7 h-7 text-brand-600" />
            Historial de turnos
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Consulte turnos cerrados o abiertos y vea el detalle de cada uno
          </p>
        </div>
        <Select
          id="filtro-estado-caja"
          label="Estado"
          className="max-w-xs"
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          hidePlaceholder
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'abierta', label: 'Abiertos' },
            { value: 'cerrada', label: 'Cerrados' },
          ]}
        />
      </div>

      {error && <Alert>{error}</Alert>}

      <Card>
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState title="Sin turnos" description="No hay sesiones con los filtros seleccionados." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b">
                    <th className="py-2 text-left">Turno</th>
                    <th className="py-2 text-left">Cajero</th>
                    <th className="py-2 text-left">Estado</th>
                    <th className="py-2 text-right">Apertura</th>
                    <th className="py-2 text-right">Esperado</th>
                    <th className="py-2 text-right">Cierre</th>
                    <th className="py-2 text-right">Dif.</th>
                    <th className="py-2 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                      <td className="py-3">
                        <div className="font-medium text-slate-800">#{s.id}</div>
                        <div className="text-xs text-slate-500">{formatDate(s.fecha_apertura)}</div>
                      </td>
                      <td className="py-3">{s.usuario_nombre}</td>
                      <td className="py-3">
                        <Badge variant={s.estado === 'abierta' ? 'activo' : 'inactivo'}>
                          {s.estado}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">{formatCurrency(s.monto_apertura)}</td>
                      <td className="py-3 text-right">
                        {s.monto_esperado != null ? formatCurrency(s.monto_esperado) : '—'}
                      </td>
                      <td className="py-3 text-right">
                        {s.monto_cierre != null ? formatCurrency(s.monto_cierre) : '—'}
                      </td>
                      <td
                        className={`py-3 text-right font-medium ${
                          s.diferencia != null && s.diferencia !== 0 ? 'text-amber-700' : ''
                        }`}
                      >
                        {s.diferencia != null ? formatCurrency(s.diferencia) : '—'}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/caja/historial/${s.id}`}
                          className="text-brand-700 hover:underline text-sm font-medium"
                        >
                          Ver detalle
                        </Link>
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
              itemLabel="sesiones"
            />
          </>
        )}
      </Card>
    </div>
  );
};

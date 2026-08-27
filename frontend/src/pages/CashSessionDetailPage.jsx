import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Wallet } from 'lucide-react';
import { cashService } from '../services/cashService';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { Card } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Pagination } from '../components/common/Pagination';
import { CashSummaryCards } from '../components/cash/CashSummaryCards';
import { CashIncomeBreakdownModal } from '../components/cash/CashIncomeBreakdownModal';
import { CashEfectivoBreakdownModal } from '../components/cash/CashEfectivoBreakdownModal';
import { CashMovementsTable } from '../components/cash/CashMovementsTable';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { getErrorMessage } from '../utils/getErrorMessage';

export const CashSessionDetailPage = () => {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [error, setError] = useState('');
  const [incomeModal, setIncomeModal] = useState(false);
  const [efectivoModal, setEfectivoModal] = useState(false);

  const listParams = useMemo(() => ({ sessionId: id }), [id]);

  const {
    items: movements,
    pagination,
    loading: movementsLoading,
    error: listError,
    setPage,
    setLimit,
  } = usePaginatedList({
    queryFn: async ({ page, limit }) => {
      const { movements: data, pagination: pag } = await cashService.movements(id, {
        page,
        limit,
      });
      return { data, pagination: pag };
    },
    params: listParams,
    defaultLimit: 25,
    enabled: Boolean(id),
  });

  const loadDetail = useCallback(async () => {
    setDetailLoading(true);
    try {
      const data = await cashService.getDetail(id);
      setDetail(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const sesion = detail?.sesion;
  const resumen = detail?.resumen;

  if (detailLoading && !detail) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/caja/historial"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-brand-700 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al historial
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Wallet className="w-7 h-7 text-brand-600" />
          Turno #{id}
        </h1>
        {sesion && (
          <p className="text-slate-500 text-sm mt-0.5">
            {sesion.usuario_nombre} · {formatDate(sesion.fecha_apertura)}
            {sesion.fecha_cierre && ` — cierre ${formatDate(sesion.fecha_cierre)}`}
          </p>
        )}
      </div>

      {(error || listError) && <Alert>{error || listError}</Alert>}

      {sesion && resumen && (
        <>
          <Card
            action={
              <Badge variant={sesion.estado === 'abierta' ? 'activo' : 'inactivo'}>
                {sesion.estado}
              </Badge>
            }
          >
            <CashSummaryCards
              resumen={resumen}
              sesion={sesion}
              onShowIngresos={() => setIncomeModal(true)}
              onShowEfectivo={() => setEfectivoModal(true)}
            />

            {sesion.estado === 'cerrada' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100 text-sm">
                <div>
                  <p className="text-slate-500">Efectivo contado</p>
                  <p className="font-semibold">
                    {sesion.monto_cierre != null ? formatCurrency(sesion.monto_cierre) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Efectivo esperado</p>
                  <p className="font-semibold">
                    {sesion.monto_esperado != null ? formatCurrency(sesion.monto_esperado) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Diferencia</p>
                  <p
                    className={`font-semibold ${
                      sesion.diferencia != null && sesion.diferencia !== 0 ? 'text-amber-700' : ''
                    }`}
                  >
                    {sesion.diferencia != null ? formatCurrency(sesion.diferencia) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Observaciones cierre</p>
                  <p className="text-slate-700">{sesion.observaciones_cierre || '—'}</p>
                </div>
              </div>
            )}
          </Card>

          <Card title="Todos los movimientos">
            {movementsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <>
                <CashMovementsTable movements={movements} />
                <Pagination
                  page={pagination.page}
                  limit={pagination.limit}
                  total={pagination.total}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                  onLimitChange={setLimit}
                  itemLabel="movimientos"
                />
              </>
            )}
          </Card>
        </>
      )}

      <CashIncomeBreakdownModal
        isOpen={incomeModal}
        onClose={() => setIncomeModal(false)}
        resumen={resumen}
      />

      <CashEfectivoBreakdownModal
        isOpen={efectivoModal}
        onClose={() => setEfectivoModal(false)}
        resumen={resumen}
      />
    </div>
  );
};

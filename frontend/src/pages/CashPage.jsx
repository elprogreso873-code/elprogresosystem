import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Plus, Lock, Unlock, History, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { cashService } from '../services/cashService';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../constants/permissions';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { Pagination } from '../components/common/Pagination';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { CashSummaryCards } from '../components/cash/CashSummaryCards';
import { CashIncomeBreakdownModal } from '../components/cash/CashIncomeBreakdownModal';
import { CashEfectivoBreakdownModal } from '../components/cash/CashEfectivoBreakdownModal';
import { CashMovementsTable } from '../components/cash/CashMovementsTable';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { getErrorMessage } from '../utils/getErrorMessage';

export const CashPage = () => {
  const { hasPermission } = usePermissions();
  const canOpen = hasPermission(PERMISSIONS.CAJA_ABRIR);
  const canClose = hasPermission(PERMISSIONS.CAJA_CERRAR);
  const canMove = hasPermission(PERMISSIONS.CAJA_MOVIMIENTO);
  const canView = hasPermission(PERMISSIONS.CAJA_VER);

  const { methods: paymentMethods } = usePaymentMethods({ activos: true });

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [moveModal, setMoveModal] = useState(false);
  const [incomeModal, setIncomeModal] = useState(false);
  const [efectivoModal, setEfectivoModal] = useState(false);
  const [montoApertura, setMontoApertura] = useState(0);
  const [montoCierre, setMontoCierre] = useState(0);
  const [movTipo, setMovTipo] = useState('ingreso');
  const [movMonto, setMovMonto] = useState(0);
  const [movMetodo, setMovMetodo] = useState('efectivo');
  const [movDesc, setMovDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sessionId = detail?.sesion?.id;
  const listParams = useMemo(() => ({ sessionId }), [sessionId]);

  const {
    items: movements,
    pagination,
    loading: movementsLoading,
    setPage,
    setLimit,
    refresh: refreshMovements,
  } = usePaginatedList({
    queryFn: async ({ page, limit }) => {
      const { movements: data, pagination: pag } = await cashService.movements(sessionId, {
        page,
        limit,
      });
      return { data, pagination: pag };
    },
    params: listParams,
    defaultLimit: 15,
    enabled: Boolean(sessionId),
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cashService.currentDetail();
      setDetail(data);
      refreshMovements();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [refreshMovements]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!success) return undefined;
    const t = setTimeout(() => setSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const sesion = detail?.sesion;
  const resumen = detail?.resumen;
  const saldoEsperado = resumen?.efectivo_fisico_esperado ?? 0;

  const metodoOptions = paymentMethods.map((m) => ({
    value: m.codigo,
    label: m.nombre,
  }));

  const handleOpen = async () => {
    setSubmitting(true);
    try {
      await cashService.open({ monto_apertura: montoApertura });
      setSuccess('Caja abierta');
      setOpenModal(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!sesion) return;
    setSubmitting(true);
    try {
      await cashService.close(sesion.id, { monto_cierre: montoCierre });
      setSuccess('Caja cerrada');
      setCloseModal(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMovement = async () => {
    if (!sesion) return;
    setSubmitting(true);
    try {
      await cashService.addMovement(sesion.id, {
        tipo: movTipo,
        monto: movMonto,
        metodo_pago: movMetodo,
        descripcion: movDesc || null,
      });
      setSuccess('Movimiento registrado');
      setMoveModal(false);
      setMovMonto(0);
      setMovDesc('');
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !detail) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-7 h-7 text-brand-600" />
            Caja
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Turno activo, arqueo de efectivo e ingresos por método de pago
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canView && (
            <Link
              to="/caja/historial"
              className="inline-flex items-center justify-center gap-2 h-11 px-4 text-sm rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-brand-400 hover:bg-brand-50/60 font-medium shadow-sm transition-all"
            >
              <History className="w-4 h-4" />
              Historial de turnos
            </Link>
          )}
          {canOpen && !sesion && (
            <Button onClick={() => setOpenModal(true)}>
              <Unlock className="w-4 h-4" /> Abrir caja
            </Button>
          )}
          {canMove && sesion && (
            <Button variant="outline" onClick={() => setMoveModal(true)}>
              <Plus className="w-4 h-4" /> Ingreso / Egreso
            </Button>
          )}
          {canClose && sesion && (
            <Button
              variant="secondary"
              onClick={() => {
                setMontoCierre(saldoEsperado);
                setCloseModal(true);
              }}
            >
              <Lock className="w-4 h-4" /> Cerrar caja
            </Button>
          )}
        </div>
      </div>

      {error && <Alert>{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {sesion ? (
        <>
          <Card
            title="Turno activo"
            subtitle={`${sesion.usuario_nombre} · desde ${formatDate(sesion.fecha_apertura)}`}
            action={<Badge variant="activo">Abierta</Badge>}
          >
            {resumen && (
              <CashSummaryCards
                resumen={resumen}
                sesion={sesion}
                onShowIngresos={() => setIncomeModal(true)}
                onShowEfectivo={() => setEfectivoModal(true)}
              />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-sm border-t border-slate-100 pt-4">
              <div>
                <p className="text-slate-500">Ingresos manuales</p>
                <p className="font-semibold flex items-center gap-1 text-emerald-700">
                  <ArrowDownCircle className="w-4 h-4" />
                  {formatCurrency(resumen?.total_ingresos_manuales ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Egresos</p>
                <p className="font-semibold flex items-center gap-1 text-red-700">
                  <ArrowUpCircle className="w-4 h-4" />
                  {formatCurrency(resumen?.total_egresos ?? sesion.total_egresos)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Cobros CC en caja</p>
                <p className="font-semibold text-blue-800">
                  {formatCurrency(resumen?.total_cobros_cuenta_corriente ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Ventas (todas)</p>
                <p className="font-semibold">{formatCurrency(resumen?.total_ventas ?? 0)}</p>
              </div>
            </div>
          </Card>

          <Card title="Movimientos del turno">
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
      ) : (
        <Card>
          <EmptyState
            title="No hay caja abierta"
            description={
              canOpen
                ? 'Abra un turno para registrar ventas, cobros y movimientos.'
                : 'Espere a que un cajero abra el turno.'
            }
          />
        </Card>
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

      <Modal isOpen={openModal} onClose={() => setOpenModal(false)} title="Abrir caja">
        <div className="space-y-4">
          <CurrencyInput
            label="Monto inicial en caja (ARS)"
            size="lg"
            value={montoApertura}
            onChange={(v) => setMontoApertura(v ?? 0)}
          />
          <Button className="w-full" onClick={handleOpen} isLoading={submitting}>
            Confirmar apertura
          </Button>
        </div>
      </Modal>

      <Modal isOpen={closeModal} onClose={() => setCloseModal(false)} title="Cerrar caja">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Efectivo esperado en caja: <strong>{formatCurrency(saldoEsperado)}</strong>
          </p>
          <CurrencyInput
            label="Efectivo contado al cierre (ARS)"
            size="lg"
            value={montoCierre}
            onChange={(v) => setMontoCierre(v ?? 0)}
          />
          <Button className="w-full" variant="secondary" onClick={handleClose} isLoading={submitting}>
            Cerrar turno
          </Button>
        </div>
      </Modal>

      <Modal isOpen={moveModal} onClose={() => setMoveModal(false)} title="Ingreso o egreso manual">
        <div className="space-y-4">
          <Select
            id="mov-tipo"
            label="Tipo"
            value={movTipo}
            onChange={(e) => setMovTipo(e.target.value)}
            options={[
              { value: 'ingreso', label: 'Ingreso' },
              { value: 'egreso', label: 'Egreso' },
            ]}
          />
          <Select
            id="mov-metodo"
            label="Método de pago"
            value={movMetodo}
            onChange={(e) => setMovMetodo(e.target.value)}
            options={metodoOptions.length ? metodoOptions : [{ value: 'efectivo', label: 'Efectivo' }]}
          />
          <CurrencyInput
            label="Monto (ARS)"
            size="lg"
            min={0.01}
            value={movMonto}
            onChange={setMovMonto}
          />
          <Input
            id="mov-desc"
            label="Descripción"
            value={movDesc}
            onChange={(e) => setMovDesc(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            Solo el efectivo físico afecta el arqueo del cajón. Otros métodos quedan en el detalle de
            ingresos.
          </p>
          <Button className="w-full" onClick={handleMovement} isLoading={submitting}>
            Registrar
          </Button>
        </div>
      </Modal>
    </div>
  );
};

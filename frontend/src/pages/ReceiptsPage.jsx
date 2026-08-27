import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Receipt, Eye, Printer, FileText } from 'lucide-react';
import { receiptService } from '../services/receiptService';
import { useDebounce } from '../hooks/useDebounce';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/SearchInput';
import { FilterToolbar } from '../components/common/FilterToolbar';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { WhatsAppIcon } from '../components/common/WhatsAppIcon';
import { InventoryPeriodFilter } from '../components/inventory/InventoryPeriodFilter';
import { SaleReceiptPrint, printSaleReceipt } from '../components/commercial/SaleReceiptPrint';
import { TIPOS_COMPROBANTE } from '../constants/permissions';
import { formatDate } from '../utils/formatDate';
import { formatCurrency } from '../utils/formatCurrency';
import { getErrorMessage } from '../utils/getErrorMessage';
import {
  openWhatsAppChat,
  buildReceiptWhatsAppMessage,
  buildQuickReceiptData,
  assertValidWhatsAppPhone,
  downloadReceiptPdfForShare,
} from '../utils/shareReceiptWhatsApp';
import {
  getDefaultDateRange,
  getPresetRange,
  isValidDateRange,
} from '../utils/dateRange';

const chipBase =
  'px-2.5 py-1 rounded-lg text-xs font-medium transition-all touch-manipulation border whitespace-nowrap';

const TIPO_CHIPS = [
  { value: 'todos', label: 'Todos' },
  ...TIPOS_COMPROBANTE,
];

const tipoBadgeVariant = {
  ticket: 'activo',
  boleta: 'admin',
  factura: 'empleado',
};

const WhatsAppActionButton = ({ receipt, loading, onClick, className = '' }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onClick(receipt)}
    disabled={loading}
    title="Enviar por WhatsApp"
    className={`!text-emerald-600 hover:!bg-emerald-50 ${className}`}
  >
    {loading ? (
      <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    ) : (
      <WhatsAppIcon />
    )}
  </Button>
);

const ReceiptCard = ({ receipt: r, onPreview, onWhatsApp, whatsappLoadingId }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-mono font-semibold text-slate-800">{r.numero}</p>
        <p className="text-xs text-slate-500 mt-0.5">Venta {r.venta_numero}</p>
      </div>
      <Badge variant={tipoBadgeVariant[r.tipo] || 'activo'} className="capitalize shrink-0">
        {r.tipo}
      </Badge>
    </div>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-400">Cliente</p>
        <p className="text-slate-700 truncate">{r.cliente_nombre || 'CF'}</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] uppercase tracking-wide text-slate-400">Total</p>
        <p className="font-bold text-brand-700 tabular-nums">{formatCurrency(r.venta_total)}</p>
      </div>
    </div>
    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
      <span className="text-xs text-slate-500">{formatDate(r.fecha_emision)}</span>
      {r.venta_estado === 'anulada' && (
        <Badge variant="inactivo" className="text-[10px]">
          Venta anulada
        </Badge>
      )}
    </div>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="flex-1" onClick={() => onPreview(r.venta_id)}>
        <Eye className="w-4 h-4" />
        Vista previa
      </Button>
      <WhatsAppActionButton
        receipt={r}
        loading={whatsappLoadingId === r.id}
        onClick={onWhatsApp}
        className="shrink-0"
      />
      <Link to={`/ventas/${r.venta_id}`} className="flex-1">
        <Button variant="ghost" size="sm" className="w-full">
          <Receipt className="w-4 h-4" />
          Ver venta
        </Button>
      </Link>
    </div>
  </div>
);

export const ReceiptsPage = () => {
  const navigate = useNavigate();
  const defaultRange = getDefaultDateRange();
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [fechaDesde, setFechaDesde] = useState(defaultRange.fecha_desde);
  const [fechaHasta, setFechaHasta] = useState(defaultRange.fecha_hasta);
  const [preview, setPreview] = useState(null);
  const [previewVentaId, setPreviewVentaId] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [whatsappLoadingId, setWhatsappLoadingId] = useState(null);
  const [success, setSuccess] = useState('');
  const debouncedSearch = useDebounce(search);
  const dateRangeValid = isValidDateRange(fechaDesde, fechaHasta);

  const listParams = useMemo(
    () => ({
      search: debouncedSearch,
      tipo: tipoFilter,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
    }),
    [debouncedSearch, tipoFilter, fechaDesde, fechaHasta]
  );

  const {
    items: receipts,
    pagination,
    loading,
    error,
    setError,
    setPage,
    setLimit,
    refresh,
  } = usePaginatedList({
    queryFn: async ({ page, limit, ...params }) => {
      const { receipts: data, pagination: pag } = await receiptService.list({
        page,
        limit,
        ...params,
      });
      return { data, pagination: pag };
    },
    params: listParams,
    enabled: dateRangeValid,
  });

  const handlePresetSelect = (presetId) => {
    if (presetId === 'custom') return;
    const range = getPresetRange(presetId);
    setFechaDesde(range.fecha_desde);
    setFechaHasta(range.fecha_hasta);
  };

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 8000);
    return () => clearTimeout(t);
  }, [success]);

  const openPreview = async (ventaId) => {
    setPreviewLoading(true);
    setPreview(null);
    setPreviewVentaId(ventaId);
    try {
      const data = await receiptService.getByVenta(ventaId);
      setPreview(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreview(null);
    setPreviewVentaId(null);
  };

  const handleWhatsApp = async (receipt) => {
    setError('');
    setSuccess('');

    if (!receipt.cliente_id) {
      setError(
        'Esta venta no tiene un cliente vinculado. No es posible enviar el comprobante por WhatsApp.'
      );
      return;
    }

    if (!receipt.cliente_telefono?.trim()) {
      navigate('/clientes/listado', {
        state: {
          editClientId: receipt.cliente_id,
          message: `${receipt.cliente_nombre || 'El cliente'} no tiene teléfono registrado. Agregue el número para enviar el comprobante por WhatsApp.`,
        },
      });
      return;
    }

    try {
      assertValidWhatsAppPhone(receipt.cliente_telefono);
    } catch (err) {
      setError(getErrorMessage(err));
      return;
    }

    const quickMessage = buildReceiptWhatsAppMessage(buildQuickReceiptData(receipt), {
      includeAttachHint: true,
    });

    // Abrir WhatsApp de forma síncrona (mismo clic) — evita bloqueo de popups en PC/PWA
    openWhatsAppChat(receipt.cliente_telefono, quickMessage);

    setWhatsappLoadingId(receipt.id);
    try {
      const receiptData = await receiptService.getByVenta(receipt.venta_id);
      await downloadReceiptPdfForShare(receiptData);

      setSuccess(
        'WhatsApp abierto en una nueva pestaña. El PDF se descargó para adjuntarlo al mensaje.'
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setWhatsappLoadingId(null);
    }
  };

  const handlePreviewWhatsApp = async () => {
    if (!preview?.venta || !previewVentaId) return;

    await handleWhatsApp({
      id: preview.comprobante?.id,
      venta_id: previewVentaId,
      cliente_id: preview.venta.cliente_id,
      cliente_nombre: preview.venta.cliente_nombre,
      cliente_telefono: preview.venta.cliente_telefono,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-brand-600" />
            Comprobantes
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Tickets, boletas y facturas emitidas</p>
        </div>
        {!loading && pagination.total > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
            <FileText className="w-4 h-4 text-brand-600 shrink-0" />
            <span>
              <strong className="text-slate-800 tabular-nums">{pagination.total}</strong> comprobante
              {pagination.total !== 1 ? 's' : ''} en el período
            </span>
          </div>
        )}
      </div>

      {!dateRangeValid && <Alert>El rango de fechas no es válido</Alert>}
      {error && <Alert>{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="!p-0 overflow-hidden">
        <div className="p-4 sm:p-6 space-y-4 border-b border-slate-100">
          <InventoryPeriodFilter
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
                id="buscar-comprobante"
                label="Buscar comprobante"
                placeholder="Nº comprobante, venta o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            }
            filters={[
              <div key="tipo" className="flex flex-col gap-1.5 w-full">
                <span className="text-sm font-medium text-slate-700">Tipo</span>
                <div className="flex flex-wrap gap-1.5">
                  {TIPO_CHIPS.map((chip) => (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => setTipoFilter(chip.value)}
                      className={`${chipBase} ${
                        tipoFilter === chip.value
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>,
            ]}
          />
        </div>

        <div className="px-4 sm:px-6 pb-6 pt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : receipts.length === 0 ? (
            <EmptyState
              title="Sin comprobantes"
              description="No hay comprobantes para el período y filtros seleccionados. Los comprobantes se generan al registrar una venta."
            />
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {receipts.map((r) => (
                  <ReceiptCard
                    key={r.id}
                    receipt={r}
                    onPreview={openPreview}
                    onWhatsApp={handleWhatsApp}
                    whatsappLoadingId={whatsappLoadingId}
                  />
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="px-4 py-3 text-left font-medium">Comprobante</th>
                      <th className="px-4 py-3 text-left font-medium">Venta</th>
                      <th className="px-4 py-3 text-left font-medium">Cliente</th>
                      <th className="px-4 py-3 text-left font-medium">Tipo</th>
                      <th className="px-4 py-3 text-right font-medium">Total</th>
                      <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Fecha</th>
                      <th className="px-4 py-3 text-right font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <p className="font-mono font-medium text-slate-800">{r.numero}</p>
                          {r.venta_estado === 'anulada' && (
                            <Badge variant="inactivo" className="mt-1 text-[10px]">
                              Venta anulada
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{r.venta_numero}</td>
                        <td className="px-4 py-3 text-slate-700">{r.cliente_nombre || 'CF'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={tipoBadgeVariant[r.tipo] || 'activo'} className="capitalize">
                            {r.tipo}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-800">
                          {formatCurrency(r.venta_total)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap hidden lg:table-cell">
                          {formatDate(r.fecha_emision)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openPreview(r.venta_id)}
                              title="Vista previa"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <WhatsAppActionButton
                              receipt={r}
                              loading={whatsappLoadingId === r.id}
                              onClick={handleWhatsApp}
                            />
                            <Link to={`/ventas/${r.venta_id}`}>
                              <Button variant="ghost" size="sm" title="Ver venta">
                                <Receipt className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
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
                itemLabel="comprobantes"
              />
            </>
          )}
        </div>
      </Card>

      <Modal
        isOpen={!!preview || previewLoading}
        onClose={closePreview}
        title="Vista previa del comprobante"
        size="lg"
        stickyFooter
        footer={
          preview && !previewLoading ? (
            <>
              <Button type="button" variant="ghost" onClick={closePreview}>
                Cerrar
              </Button>
              <Button
                variant="outline"
                onClick={handlePreviewWhatsApp}
                disabled={!!whatsappLoadingId}
                className="!text-emerald-700 !border-emerald-200 hover:!bg-emerald-50"
              >
                {whatsappLoadingId ? (
                  <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <WhatsAppIcon />
                )}
                WhatsApp
              </Button>
              <Button onClick={() => setTimeout(printSaleReceipt, 150)}>
                <Printer className="w-4 h-4" />
                Imprimir
              </Button>
            </>
          ) : null
        }
      >
        {previewLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          preview && (
            <div className="border border-slate-200 rounded-xl p-4 sm:p-6 bg-white text-sm max-h-[min(60dvh,480px)] overflow-y-auto">
              <SaleReceiptPrint data={preview} preview />
            </div>
          )
        )}
      </Modal>

      {preview && <SaleReceiptPrint data={preview} />}
    </div>
  );
};

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, SlidersHorizontal, Package, AlertTriangle } from 'lucide-react';
import { Input } from '../ui/Input';
import { ProductPicker } from '../catalog/ProductPicker';
import { ProductImage } from '../catalog/ProductImage';
import { ProductMetaChips } from '../catalog/ProductMetaChips';
import { movementFormSchema } from '../../validations/commercialSchemas';
import { formatNumber } from '../../utils/formatCurrency';

const TIPO_OPTIONS = [
  {
    value: 'entrada',
    label: 'Entrada',
    hint: 'Suma al stock',
    icon: ArrowDown,
    activeClass: 'bg-emerald-500 text-white border-emerald-500',
  },
  {
    value: 'salida',
    label: 'Salida',
    hint: 'Resta del stock',
    icon: ArrowUp,
    activeClass: 'bg-red-500 text-white border-red-500',
  },
  {
    value: 'ajuste',
    label: 'Ajuste',
    hint: 'Stock exacto',
    icon: SlidersHorizontal,
    activeClass: 'bg-blue-500 text-white border-blue-500',
  },
];

const tipoChipClass = (active, activeClass) =>
  `flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border touch-manipulation min-h-[4.5rem] ${
    active
      ? `${activeClass} shadow-sm`
      : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
  }`;

export const InventoryMovementForm = ({
  formId = 'inventory-movement-form',
  onSubmit,
}) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(movementFormSchema),
    defaultValues: { producto_id: '', tipo: 'entrada', cantidad: '', motivo: '' },
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const tipo = watch('tipo');
  const cantidad = watch('cantidad');
  const cantidadNum = Number(cantidad) || 0;
  const stockActual = Number(selectedProduct?.stock) || 0;

  const stockInsuficiente =
    tipo === 'salida' && selectedProduct && cantidadNum > 0 && cantidadNum > stockActual;

  const stockProyectado =
    selectedProduct && cantidadNum > 0
      ? tipo === 'entrada'
        ? stockActual + cantidadNum
        : tipo === 'salida'
          ? stockActual - cantidadNum
          : cantidadNum
      : null;

  const handleFormSubmit = (data) => onSubmit(data);

  return (
    <form id={formId} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Tipo de movimiento
        </p>
        <Controller
          name="tipo"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-3 gap-2">
              {TIPO_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = field.value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={tipoChipClass(active, opt.activeClass)}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{opt.label}</span>
                    <span className={`text-[10px] font-normal ${active ? 'opacity-90' : 'text-slate-500'}`}>
                      {opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.tipo?.message && (
          <p className="mt-1 text-sm text-red-600">{errors.tipo.message}</p>
        )}
      </div>

      <Controller
        name="producto_id"
        control={control}
        render={({ field }) => (
          <ProductPicker
            id="mov-producto_id"
            label="Producto"
            size="md"
            value={field.value ? String(field.value) : ''}
            selectedProduct={selectedProduct}
            onChange={(v) => {
              field.onChange(v ? Number(v) : '');
              if (!v) setSelectedProduct(null);
            }}
            onProductSelect={setSelectedProduct}
            error={errors.producto_id?.message}
            placeholder="Buscar por código o nombre…"
          />
        )}
      />

      {selectedProduct && (
        <div className="rounded-xl border border-brand-200/70 bg-gradient-to-br from-slate-50 to-brand-50/30 p-3 flex items-center gap-3">
          <ProductImage
            src={selectedProduct.imagen_url}
            alt={selectedProduct.nombre}
            size="md"
            enlargeable={!!selectedProduct.imagen_url}
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{selectedProduct.nombre}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedProduct.codigo}</p>
            <ProductMetaChips
              color={selectedProduct.color}
              talle={selectedProduct.talle}
              className="mt-1"
            />
            <p className="text-xs text-slate-600 mt-1.5">
              Stock actual:{' '}
              <span className="font-semibold tabular-nums">
                {formatNumber(stockActual, 2)} {selectedProduct.unidad_medida || 'unidad'}
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          id="cantidad"
          label={tipo === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
          type="number"
          step="0.001"
          min="0"
          size="md"
          hint={
            tipo === 'ajuste'
              ? 'El stock quedará en este valor exacto'
              : tipo === 'salida'
                ? 'Se descontará del stock actual'
                : 'Se sumará al stock actual'
          }
          error={errors.cantidad?.message}
          {...register('cantidad')}
        />
        <Input
          id="motivo"
          label="Motivo"
          size="md"
          placeholder="Ej: Compra proveedor, merma…"
          error={errors.motivo?.message}
          {...register('motivo')}
        />
      </div>

      {stockInsuficiente && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Stock insuficiente. Disponible: {formatNumber(stockActual, 2)}.
          </p>
        </div>
      )}

      {stockProyectado != null && cantidadNum > 0 && !stockInsuficiente && selectedProduct && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
          <Package className="w-4 h-4 text-brand-600 shrink-0" />
          <p>
            Stock resultante:{' '}
            <span className="font-semibold tabular-nums">
              {formatNumber(stockActual, 2)} → {formatNumber(stockProyectado, 2)}
            </span>
          </p>
        </div>
      )}
    </form>
  );
};

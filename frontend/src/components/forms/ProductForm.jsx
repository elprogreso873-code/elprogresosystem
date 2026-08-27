import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Package } from 'lucide-react';
import { Input } from '../ui/Input';
import { formatNumber } from '../../utils/formatCurrency';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Select } from '../ui/Select';
import { CategoryPicker } from '../catalog/CategoryPicker';
import { ProductFormPreview } from '../catalog/ProductFormPreview';
import { productFormSchema } from '../../validations/catalogSchemas';
import { UNIDADES_MEDIDA } from '../../constants/permissions';

export const ProductForm = ({
  formId = 'product-form',
  categories = [],
  onCategoryCreated,
  defaultValues,
  isEditing = false,
  stockActual = null,
  onSubmit,
}) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultValues || {
      codigo: '',
      nombre: '',
      descripcion: '',
      imagen_url: '',
      color: '',
      talle: '',
      categoria_id: '',
      precio_venta: 0,
      venta_por_paquete: false,
      precio_venta_paquete: 0,
      unidades_por_paquete: 1,
      precio_costo: 0,
      stock: 0,
      stock_minimo: 0,
      unidad_medida: 'unidad',
      estado: 'activo',
    },
  });

  const [previewKey, setPreviewKey] = useState(0);
  const watched = watch();

  const categoryName =
    categories.find((c) => String(c.id) === String(watched.categoria_id))?.nombre || '';

  const handleCategoryCreated = (categoria) => {
    onCategoryCreated?.(categoria);
    setValue('categoria_id', categoria.id, { shouldValidate: true });
  };

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      codigo: data.codigo || null,
      descripcion: data.descripcion || null,
      imagen_url: data.imagen_url || null,
      color: data.color || null,
      talle: data.talle || null,
      precio_venta_paquete:
        data.venta_por_paquete && data.precio_venta_paquete > 0
          ? data.precio_venta_paquete
          : null,
      unidades_por_paquete: data.venta_por_paquete ? data.unidades_por_paquete : 1,
      venta_por_paquete: undefined,
    };

    if (isEditing) {
      delete payload.stock;
    } else {
      payload.stock = data.stock ?? 0;
    }

    onSubmit(payload);
  };

  const ventaPorPaquete = watch('venta_por_paquete');
  const unidadMedida = watch('unidad_medida');

  useEffect(() => {
    if (!ventaPorPaquete) {
      setValue('precio_venta_paquete', 0);
      setValue('unidades_por_paquete', 1);
    }
  }, [ventaPorPaquete, setValue]);

  const estadoOptions = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
  ];

  return (
    <form id={formId} onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_260px] gap-5 xl:gap-6">
        {/* Columna formulario — compacta */}
        <div className="space-y-3.5 min-w-0">
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="codigo"
              label="Código / SKU (opcional)"
              size="md"
              placeholder="PROD-001"
              error={errors.codigo?.message}
              {...register('codigo')}
            />
            <Controller
              name="categoria_id"
              control={control}
              render={({ field }) => (
                <CategoryPicker
                  id="categoria_id"
                  label="Categoría"
                  size="md"
                  value={field.value ? String(field.value) : ''}
                  categories={categories}
                  onChange={(v) => field.onChange(v ? Number(v) : '')}
                  onCategoryCreated={handleCategoryCreated}
                  error={errors.categoria_id?.message}
                />
              )}
            />
          </div>

          <Input
            id="nombre"
            label="Nombre"
            size="md"
            placeholder="Nombre comercial"
            error={errors.nombre?.message}
            {...register('nombre')}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Input
              id="color"
              label="Color"
              size="md"
              placeholder="Opcional"
              error={errors.color?.message}
              {...register('color')}
            />
            <Input
              id="talle"
              label="Talle"
              size="md"
              placeholder="Opcional"
              error={errors.talle?.message}
              {...register('talle')}
            />
            <div className="col-span-2 sm:col-span-1">
              <Select
                id="unidad_medida"
                label="Unidad"
                size="md"
                hidePlaceholder
                options={UNIDADES_MEDIDA}
                error={errors.unidad_medida?.message}
                {...register('unidad_medida')}
              />
            </div>
          </div>

          <Input
            id="imagen_url"
            label="URL imagen (opcional)"
            size="md"
            placeholder="https://…"
            hint="Enlace directo http/https"
            error={errors.imagen_url?.message}
            {...register('imagen_url', {
              onChange: () => setPreviewKey((k) => k + 1),
            })}
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="precio_venta"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="precio_venta"
                    label={`Precio suelto (por ${unidadMedida || 'unidad'})`}
                    size="md"
                    emptyZero
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.precio_venta?.message}
                  />
                )}
              />
              <Controller
                name="precio_costo"
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    id="precio_costo"
                    label="Precio costo"
                    size="md"
                    emptyZero
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.precio_costo?.message}
                  />
                )}
              />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
                {...register('venta_por_paquete')}
              />
              <span className="text-sm text-slate-700">
                <span className="font-medium">También vender por paquete / bulto</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  Ej: paquete de 1.000 palillos o rollo completo en kg
                </span>
              </span>
            </label>

            {ventaPorPaquete && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Controller
                  name="precio_venta_paquete"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      id="precio_venta_paquete"
                      label="Precio del paquete completo"
                      size="md"
                      emptyZero
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.precio_venta_paquete?.message}
                    />
                  )}
                />
                <Controller
                  name="unidades_por_paquete"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="unidades_por_paquete"
                      label={`Unidades por paquete (${unidadMedida || 'unidad'})`}
                      type="number"
                      step="0.001"
                      min="0.001"
                      size="md"
                      emptyZero={false}
                      hint="Cuántas unidades de stock descuenta 1 paquete"
                      error={errors.unidades_por_paquete?.message}
                      name={field.name}
                      value={field.value}
                      onChange={(e) => {
                        const raw = e?.target?.value;
                        const num = raw === '' || raw == null ? '' : Number(raw);
                        field.onChange(num === '' || Number.isNaN(num) ? '' : num);
                      }}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Package className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Stock actual:{' '}
                    <strong className="tabular-nums text-slate-900">
                      {formatNumber(stockActual ?? 0, 2)}
                    </strong>
                    {unidadMedida ? ` ${unidadMedida}` : ''}
                  </span>
                </div>
                <Link
                  to="/catalogo/inventario"
                  className="text-xs font-medium text-brand-700 hover:text-brand-800 underline underline-offset-2"
                >
                  Ajustar en Inventario
                </Link>
              </div>
              <p className="text-xs text-slate-500">
                Para modificar el stock use Inventario (entradas, salidas o ajustes).
              </p>
            </div>
          ) : (
            <Input
              id="stock"
              label={`Stock inicial${unidadMedida ? ` (${unidadMedida})` : ''}`}
              type="number"
              step="0.001"
              min="0"
              size="md"
              hint="Cantidad al dar de alta el producto. Luego se gestiona en Inventario."
              error={errors.stock?.message}
              {...register('stock')}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="stock_minimo"
              label="Stock mínimo (alerta)"
              type="number"
              step="0.001"
              min="0"
              size="md"
              hint="Umbral para avisos de stock bajo"
              error={errors.stock_minimo?.message}
              {...register('stock_minimo')}
            />
            <Select
              id="estado"
              label="Estado"
              size="md"
              hidePlaceholder
              options={estadoOptions}
              error={errors.estado?.message}
              {...register('estado')}
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-1.5">
              Descripción <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              id="descripcion"
              rows={2}
              placeholder="Notas del producto…"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 resize-none"
              {...register('descripcion')}
            />
          </div>
        </div>

        {/* Columna vista previa — sticky en XL */}
        <div className="xl:sticky xl:top-0 xl:self-start">
          <ProductFormPreview
            key={previewKey}
            product={{ ...watched, stock: isEditing ? (stockActual ?? 0) : watched.stock }}
            categoryName={categoryName}
          />
        </div>
      </div>
    </form>
  );
};

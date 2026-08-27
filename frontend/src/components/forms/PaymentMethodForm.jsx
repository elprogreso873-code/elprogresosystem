import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import {
  paymentMethodFormSchema,
  paymentMethodEditSchema,
} from '../../validations/paymentMethodSchemas';

const FlagField = ({ id, label, hint, register }) => (
  <label
    htmlFor={id}
    className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/80 cursor-pointer"
  >
    <input
      id={id}
      type="checkbox"
      className="mt-1 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
      {...register(id)}
    />
    <span>
      <span className="block text-sm font-medium text-slate-800">{label}</span>
      {hint && <span className="block text-xs text-slate-500 mt-0.5">{hint}</span>}
    </span>
  </label>
);

export const PaymentMethodForm = ({
  mode = 'create',
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const isEdit = mode === 'edit';
  const schema = isEdit ? paymentMethodEditSchema : paymentMethodFormSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      codigo: '',
      nombre: '',
      descripcion: '',
      requiere_cliente: false,
      requiere_monto_recibido: false,
      registra_en_caja: false,
      genera_cargo_cc: false,
      es_predeterminado: false,
      orden: 0,
      estado: 'activo',
    },
  });

  const estadoOptions = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
  ];

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      codigo: data.codigo?.trim().toLowerCase(),
      descripcion: data.descripcion?.trim() || null,
      requiere_cliente: Boolean(data.requiere_cliente),
      requiere_monto_recibido: Boolean(data.requiere_monto_recibido),
      registra_en_caja: Boolean(data.registra_en_caja),
      genera_cargo_cc: Boolean(data.genera_cargo_cc),
      es_predeterminado: Boolean(data.es_predeterminado),
      orden: Number(data.orden) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {!isEdit && (
        <Input
          id="codigo"
          label="Código interno"
          size="lg"
          placeholder="ej: tarjeta_debito"
          hint="Solo letras, números y _. No se puede cambiar después."
          error={errors.codigo?.message}
          {...register('codigo')}
        />
      )}

      <Input
        id="nombre"
        label="Nombre visible"
        size="lg"
        placeholder="Ej: Tarjeta de débito"
        error={errors.nombre?.message}
        {...register('nombre')}
      />

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-2">
          Descripción (opcional)
        </label>
        <textarea
          id="descripcion"
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-[15px] focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500"
          {...register('descripcion')}
        />
      </div>

      <Input
        id="orden"
        label="Orden en listas"
        type="number"
        min="0"
        size="lg"
        error={errors.orden?.message}
        {...register('orden')}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <FlagField
          id="requiere_monto_recibido"
          label="Monto recibido y vuelto"
          hint="Como efectivo en caja"
          register={register}
        />
        <FlagField
          id="registra_en_caja"
          label="Registra en caja"
          hint="Suma al turno de caja abierto"
          register={register}
        />
        <FlagField
          id="requiere_cliente"
          label="Requiere cliente"
          hint="No disponible sin cliente seleccionado"
          register={register}
        />
        <FlagField
          id="genera_cargo_cc"
          label="Cuenta corriente"
          hint="Genera cargo en saldo del cliente"
          register={register}
        />
        <FlagField
          id="es_predeterminado"
          label="Predeterminado en ventas"
          register={register}
        />
      </div>

      <Select
        id="estado"
        label="Estado"
        size="lg"
        hidePlaceholder
        options={estadoOptions}
        error={errors.estado?.message}
        {...register('estado')}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isEdit ? 'Guardar' : 'Crear método'}
        </Button>
      </div>
    </form>
  );
};

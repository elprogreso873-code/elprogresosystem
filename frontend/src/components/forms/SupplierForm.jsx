import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCheck, UserX } from 'lucide-react';
import { Input } from '../ui/Input';
import { supplierFormSchema } from '../../validations/supplierSchemas';

const ESTADO_OPTIONS = [
  {
    value: 'activo',
    label: 'Activo',
    hint: 'Puede recibir compras',
    icon: UserCheck,
    activeClass: 'bg-emerald-500 text-white border-emerald-500',
  },
  {
    value: 'inactivo',
    label: 'Inactivo',
    hint: 'No disponible',
    icon: UserX,
    activeClass: 'bg-slate-600 text-white border-slate-600',
  },
];

export const SupplierForm = ({
  formId = 'supplier-form',
  defaultValues,
  onSubmit,
  isEditing = false,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: defaultValues || {
      nombre: '',
      cuit: '',
      email: '',
      telefono: '',
      direccion: '',
      observaciones: '',
      estado: 'activo',
    },
  });

  const [estado, setEstado] = useState(defaultValues?.estado || 'activo');

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      cuit: data.cuit || null,
      email: data.email || null,
      telefono: data.telefono || null,
      direccion: data.direccion || null,
      observaciones: data.observaciones || null,
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input
        id="prov-nombre"
        label="Nombre"
        size="lg"
        autoFocus={!isEditing}
        error={errors.nombre?.message}
        {...register('nombre')}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="prov-cuit"
          label="CUIT"
          size="lg"
          placeholder="Opcional"
          error={errors.cuit?.message}
          {...register('cuit')}
        />
        <Input
          id="prov-telefono"
          label="Teléfono"
          size="lg"
          placeholder="Opcional"
          error={errors.telefono?.message}
          {...register('telefono')}
        />
      </div>
      <Input
        id="prov-email"
        label="Email"
        size="lg"
        placeholder="Opcional"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        id="prov-direccion"
        label="Dirección"
        size="lg"
        placeholder="Opcional"
        error={errors.direccion?.message}
        {...register('direccion')}
      />
      <Input
        id="prov-obs"
        label="Observaciones"
        size="lg"
        placeholder="Opcional"
        error={errors.observaciones?.message}
        {...register('observaciones')}
      />
      {isEditing && (
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Estado</p>
          <div className="flex gap-2">
            {ESTADO_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = estado === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setEstado(opt.value);
                    setValue('estado', opt.value);
                  }}
                  className={`flex-1 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl text-sm font-medium border ${
                    active
                      ? `${opt.activeClass} shadow-sm`
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                  <span className="text-[10px] opacity-80">{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </form>
  );
};

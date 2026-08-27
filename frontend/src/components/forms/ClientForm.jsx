import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserCheck, UserX } from 'lucide-react';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Select } from '../ui/Select';
import { ClientFormPreview } from '../commercial/ClientFormPreview';
import { clientFormSchema } from '../../validations/commercialSchemas';
import { TIPOS_DOCUMENTO } from '../../constants/permissions';

const ESTADO_OPTIONS = [
  {
    value: 'activo',
    label: 'Activo',
    hint: 'Puede comprar',
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

const estadoChipClass = (active, activeClass) =>
  `flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border touch-manipulation flex-1 min-h-[4rem] ${
    active
      ? `${activeClass} shadow-sm`
      : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
  }`;

export const ClientForm = ({
  formId = 'client-form',
  defaultValues,
  onSubmit,
  isEditing = false,
}) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clientFormSchema),
    defaultValues: defaultValues || {
      tipo_documento: 'CF',
      numero_documento: '',
      nombre: '',
      email: '',
      telefono: '',
      direccion: '',
      estado: 'activo',
      limite_credito: '',
    },
  });

  const watched = watch();

  const handleFormSubmit = (data) => {
    onSubmit({
      ...data,
      numero_documento: data.numero_documento || null,
      email: data.email || null,
      telefono: data.telefono || null,
      direccion: data.direccion || null,
      limite_credito: data.limite_credito ?? null,
    });
  };

  return (
    <form id={formId} onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_240px] gap-5 xl:gap-6">
        <div className="space-y-4 min-w-0">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Identificación
            </p>
            <div className="space-y-3">
              <Input
                id="nombre"
                label="Nombre completo"
                size="md"
                placeholder="Nombre y apellido o razón social"
                error={errors.nombre?.message}
                {...register('nombre')}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  id="tipo_documento"
                  label="Tipo documento"
                  size="md"
                  hidePlaceholder
                  options={TIPOS_DOCUMENTO}
                  error={errors.tipo_documento?.message}
                  {...register('tipo_documento')}
                />
                <Input
                  id="numero_documento"
                  label="Nº documento"
                  size="md"
                  placeholder="Opcional"
                  error={errors.numero_documento?.message}
                  {...register('numero_documento')}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Contacto
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  id="telefono"
                  label="Teléfono"
                  size="md"
                  placeholder="Opcional"
                  error={errors.telefono?.message}
                  {...register('telefono')}
                />
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  size="md"
                  placeholder="Opcional"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>
              <Input
                id="direccion"
                label="Dirección"
                size="md"
                placeholder="Opcional"
                error={errors.direccion?.message}
                {...register('direccion')}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
              Cuenta corriente
            </p>
            <Controller
              name="limite_credito"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id="limite_credito"
                  label="Límite de crédito"
                  size="md"
                  hint="Opcional. Máximo en cuenta corriente."
                  allowEmpty
                  emptyZero
                  value={field.value === '' || field.value == null ? null : field.value}
                  onChange={(v) => field.onChange(v ?? '')}
                  onBlur={field.onBlur}
                  error={errors.limite_credito?.message}
                />
              )}
            />
          </div>

          {isEditing && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                Estado
              </p>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2">
                    {ESTADO_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = field.value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={estadoChipClass(active, opt.activeClass)}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{opt.label}</span>
                          <span
                            className={`text-[10px] font-normal ${active ? 'opacity-90' : 'text-slate-500'}`}
                          >
                            {opt.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              {errors.estado?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.estado.message}</p>
              )}
            </div>
          )}
        </div>

        <div className="xl:sticky xl:top-0 xl:self-start">
          <ClientFormPreview client={watched} />
        </div>
      </div>
    </form>
  );
};

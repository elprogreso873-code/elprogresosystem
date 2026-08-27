import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Input } from '../ui/Input';

const ADJUST_OPTIONS = [
  {
    value: 'disminuir',
    label: 'Disminuir',
    hint: 'Abona deuda',
    icon: ArrowDown,
    activeClass: 'bg-emerald-500 text-white border-emerald-500',
  },
  {
    value: 'aumentar',
    label: 'Aumentar',
    hint: 'Suma deuda',
    icon: ArrowUp,
    activeClass: 'bg-red-500 text-white border-red-500',
  },
];

const chipClass = (active, activeClass) =>
  `flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border touch-manipulation flex-1 min-h-[4rem] ${
    active
      ? `${activeClass} shadow-sm`
      : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50'
  }`;

const schema = z.object({
  tipo_ajuste: z.enum(['disminuir', 'aumentar']),
  monto: z.coerce.number().positive('Ingrese un monto mayor a 0'),
  observaciones: z.string().min(3, 'Mínimo 3 caracteres').max(500),
});

export const AccountAdjustmentForm = ({
  formId = 'account-adjustment-form',
  onSubmit,
}) => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo_ajuste: 'disminuir',
      monto: 0,
      observaciones: '',
    },
  });

  const tipo = watch('tipo_ajuste');

  return (
    <form
      id={formId}
      onSubmit={handleSubmit((data) =>
        onSubmit({
          monto: data.monto,
          tipo_ajuste: data.tipo_ajuste,
          observaciones: data.observaciones.trim(),
        })
      )}
      className="space-y-4"
    >
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          Tipo de ajuste
        </p>
        <div className="grid grid-cols-2 gap-2">
          {ADJUST_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = tipo === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue('tipo_ajuste', opt.value, { shouldValidate: true })}
                className={chipClass(active, opt.activeClass)}
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
        <input type="hidden" {...register('tipo_ajuste')} />
      </div>

      <Controller
        name="monto"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            id="adj-monto"
            label="Monto"
            size="md"
            min={0.01}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.monto?.message}
          />
        )}
      />

      <Input
        id="adj-motivo"
        label="Motivo"
        size="md"
        placeholder="Ej: Corrección, bonificación, error de carga…"
        error={errors.observaciones?.message}
        {...register('observaciones')}
      />
    </form>
  );
};

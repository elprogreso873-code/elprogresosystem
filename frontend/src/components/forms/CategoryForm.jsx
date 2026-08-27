import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { categoryFormSchema } from '../../validations/catalogSchemas';

export const CategoryForm = ({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: defaultValues || {
      nombre: '',
      descripcion: '',
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
      descripcion: data.descripcion || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <Input
        id="nombre"
        label="Nombre de la categoría"
        size="lg"
        placeholder="Ej: Bebidas"
        error={errors.nombre?.message}
        {...register('nombre')}
      />

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-2">
          Descripción (opcional)
        </label>
        <textarea
          id="descripcion"
          rows={3}
          placeholder="Descripción breve de la categoría..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-[15px] shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500"
          {...register('descripcion')}
        />
        {errors.descripcion && (
          <p className="mt-1.5 text-sm text-red-600">{errors.descripcion.message}</p>
        )}
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
          Guardar categoría
        </Button>
      </div>
    </form>
  );
};

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { createUserSchema, updateUserSchema } from '../../validations/authSchemas';

export const UserForm = ({
  mode = 'create',
  defaultValues,
  roles = [],
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const schema = mode === 'create' ? createUserSchema : updateUserSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      nombre_usuario: '',
      contrasena: '',
      rol_id: '',
      estado: 'activo',
    },
  });

  const roleLabels = { admin: 'Administrador', empleado: 'Empleado' };

  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: roleLabels[r.nombre] || r.nombre,
  }));

  const estadoOptions = [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
  ];

  const handleFormSubmit = (data) => {
    const payload = { ...data };
    if (mode === 'edit' && !payload.contrasena) {
      delete payload.contrasena;
    }
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <Input
        id="nombre_usuario"
        label="Nombre de usuario"
        size="lg"
        placeholder="ej: juan.perez"
        error={errors.nombre_usuario?.message}
        {...register('nombre_usuario')}
      />

      <Input
        id="contrasena"
        label={mode === 'create' ? 'Contraseña' : 'Nueva contraseña (opcional)'}
        size="lg"
        type="password"
        placeholder={mode === 'create' ? 'Mín. 8 caracteres' : 'Dejar vacío para no cambiar'}
        error={errors.contrasena?.message}
        {...register('contrasena')}
      />

      <Select
        id="rol_id"
        label="Rol"
        size="lg"
        options={roleOptions}
        error={errors.rol_id?.message}
        {...register('rol_id')}
      />

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
          {mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
};

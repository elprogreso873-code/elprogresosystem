import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CurrencyInput } from '../ui/CurrencyInput';
import { Alert } from '../ui/Alert';
import { clientService } from '../../services/clientService';
import { quickClientFormSchema } from '../../validations/quickClientSchema';
import { getErrorMessage } from '../../utils/getErrorMessage';

export const QuickClientCreateModal = ({
  isOpen,
  onClose,
  initialNombre = '',
  onCreated,
  showCreditLimit = true,
  title = 'Crear cliente rápido',
}) => {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(quickClientFormSchema),
    defaultValues: {
      nombre: '',
      telefono: '',
      numero_documento: '',
      limite_credito: '',
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    reset({
      nombre: initialNombre.trim(),
      telefono: '',
      numero_documento: '',
      limite_credito: '',
    });
  }, [isOpen, initialNombre, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setError('');
    try {
      const cliente = await clientService.create({
        tipo_documento: 'CF',
        nombre: data.nombre.trim(),
        telefono: data.telefono?.trim() || null,
        numero_documento: data.numero_documento?.trim() || null,
        email: null,
        direccion: null,
        estado: 'activo',
        limite_credito: data.limite_credito ?? null,
      });
      onCreated?.(cliente);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="quick-client-form"
            isLoading={submitting}
            disabled={submitting}
          >
            <UserPlus className="w-4 h-4" />
            Crear y seleccionar
          </Button>
        </>
      }
    >
      <form id="quick-client-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-slate-600">
          Complete los datos mínimos. El cliente quedará activo y seleccionado en la venta.
        </p>

        {error && <Alert>{error}</Alert>}

        <Input
          id="quick-client-nombre"
          label="Nombre completo"
          size="lg"
          autoFocus
          error={errors.nombre?.message}
          {...register('nombre')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="quick-client-telefono"
            label="Teléfono"
            size="lg"
            placeholder="Opcional"
            error={errors.telefono?.message}
            {...register('telefono')}
          />
          <Input
            id="quick-client-doc"
            label="DNI / Documento"
            size="lg"
            placeholder="Opcional"
            error={errors.numero_documento?.message}
            {...register('numero_documento')}
          />
        </div>

        {showCreditLimit && (
          <Controller
            name="limite_credito"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                id="quick-client-limite"
                label="Límite cuenta corriente"
                size="lg"
                hint="Opcional"
                allowEmpty
                emptyZero
                value={field.value === '' || field.value == null ? null : field.value}
                onChange={(v) => field.onChange(v ?? '')}
                onBlur={field.onBlur}
                error={errors.limite_credito?.message}
              />
            )}
          />
        )}
      </form>
    </Modal>
  );
};

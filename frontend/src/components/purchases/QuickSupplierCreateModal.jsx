import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Truck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { supplierService } from '../../services/supplierService';
import { quickSupplierFormSchema } from '../../validations/supplierSchemas';
import { getErrorMessage } from '../../utils/getErrorMessage';

export const QuickSupplierCreateModal = ({
  isOpen,
  onClose,
  initialNombre = '',
  onCreated,
}) => {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(quickSupplierFormSchema),
    defaultValues: { nombre: '', telefono: '', cuit: '' },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({ nombre: initialNombre.trim(), telefono: '', cuit: '' });
  }, [isOpen, initialNombre, reset]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    setError('');
    try {
      const proveedor = await supplierService.create({
        nombre: data.nombre.trim(),
        telefono: data.telefono?.trim() || null,
        cuit: data.cuit?.trim() || null,
        estado: 'activo',
      });
      onCreated?.(proveedor);
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
      title="Nuevo proveedor"
      size="sm"
      zIndex={60}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="quick-supplier-form" isLoading={submitting}>
            <Truck className="w-4 h-4" />
            Crear y seleccionar
          </Button>
        </>
      }
    >
      <form id="quick-supplier-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Input
          id="qs-nombre"
          label="Nombre"
          size="lg"
          autoFocus
          error={errors.nombre?.message}
          {...register('nombre')}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input id="qs-cuit" label="CUIT" size="lg" placeholder="Opcional" {...register('cuit')} />
          <Input
            id="qs-tel"
            label="Teléfono"
            size="lg"
            placeholder="Opcional"
            {...register('telefono')}
          />
        </div>
      </form>
    </Modal>
  );
};

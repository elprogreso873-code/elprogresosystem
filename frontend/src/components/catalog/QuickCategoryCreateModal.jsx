import { useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import { FolderPlus } from 'lucide-react';

import { z } from 'zod';

import { Modal } from '../ui/Modal';

import { Button } from '../ui/Button';

import { Input } from '../ui/Input';

import { Alert } from '../ui/Alert';

import { categoryService } from '../../services/categoryService';

import { getErrorMessage } from '../../utils/getErrorMessage';



const quickCategorySchema = z.object({

  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100).trim(),

  descripcion: z.string().max(500).optional().or(z.literal('')),

});



export const QuickCategoryCreateModal = ({

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

    resolver: zodResolver(quickCategorySchema),

    defaultValues: { nombre: '', descripcion: '' },

  });



  useEffect(() => {

    if (!isOpen) return;

    setError('');

    reset({ nombre: initialNombre.trim(), descripcion: '' });

  }, [isOpen, initialNombre, reset]);



  const onSubmit = async (data) => {

    setSubmitting(true);

    setError('');

    try {

      const categoria = await categoryService.create({

        nombre: data.nombre.trim(),

        descripcion: data.descripcion?.trim() || null,

        estado: 'activo',

      });

      onCreated?.(categoria);

      onClose();

    } catch (err) {

      setError(getErrorMessage(err));

    } finally {

      setSubmitting(false);

    }

  };



  const submitForm = handleSubmit(onSubmit);



  const handleEnterKey = (e) => {

    if (e.key === 'Enter' && !e.shiftKey) {

      e.preventDefault();

      e.stopPropagation();

      submitForm();

    }

  };



  return (

    <Modal

      isOpen={isOpen}

      onClose={onClose}

      title="Nueva categoría"

      size="sm"

      zIndex={60}

      footer={

        <>

          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>

            Cancelar

          </Button>

          <Button type="button" onClick={submitForm} isLoading={submitting} disabled={submitting}>

            <FolderPlus className="w-4 h-4" />

            Crear y seleccionar

          </Button>

        </>

      }

    >

      <div className="space-y-4" onKeyDown={handleEnterKey}>

        <p className="text-sm text-slate-600">

          La categoría quedará activa y seleccionada para este producto.

        </p>

        {error && <Alert>{error}</Alert>}

        <Input

          id="quick-cat-nombre"

          label="Nombre"

          size="lg"

          autoFocus

          placeholder="Ej: Ropa, Accesorios"

          error={errors.nombre?.message}

          {...register('nombre')}

        />

        <Input

          id="quick-cat-desc"

          label="Descripción (opcional)"

          size="lg"

          placeholder="Breve descripción"

          error={errors.descripcion?.message}

          {...register('descripcion')}

        />

      </div>

    </Modal>

  );

};


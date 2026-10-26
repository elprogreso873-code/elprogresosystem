import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { ProductForm } from '../forms/ProductForm';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { getErrorMessage } from '../../utils/getErrorMessage';

export const ProductQuickCreateModal = ({
  isOpen,
  onClose,
  onCreated,
  initialNombre = '',
}) => {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    categoryService
      .listActive()
      .then((items) => {
        if (!cancelled) setCategories(items);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleCategoryCreated = (categoria) => {
    setCategories((prev) => {
      if (prev.some((c) => c.id === categoria.id)) return prev;
      return [...prev, categoria].sort((a, b) => a.nombre.localeCompare(b.nombre));
    });
  };

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setError('');
    try {
      const producto = await productService.create({ ...data, stock: 0 });
      onCreated?.(producto);
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
      title="Nuevo producto"
      size="3xl"
      stickyFooter
      zIndex={60}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="purchase-product-form" isLoading={submitting}>
            Crear y agregar
          </Button>
        </>
      }
    >
      {error && <Alert className="mb-4">{error}</Alert>}
      <p className="text-sm text-slate-600 mb-4">
        El stock se suma al confirmar la compra. Acá solo se crea el producto.
      </p>
      {isOpen && (
        <ProductForm
          key={`purchase-new-${initialNombre}`}
          formId="purchase-product-form"
          categories={categories}
          onCategoryCreated={handleCategoryCreated}
          defaultValues={{
            codigo: '',
            nombre: initialNombre,
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
          }}
          onSubmit={handleSubmit}
        />
      )}
    </Modal>
  );
};

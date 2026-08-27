import { z } from 'zod';
import { UNIDADES_MEDIDA } from '../constants/permissions';

const unidades = UNIDADES_MEDIDA.map((u) => u.value);

export const categoryFormSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  descripcion: z.string().max(500).optional().or(z.literal('')),
  estado: z.enum(['activo', 'inactivo']),
});

const optionalUrl = z
  .union([
    z.literal(''),
    z.string().max(500, 'URL demasiado larga').url('Ingrese una URL válida (http o https)'),
  ])
  .optional()
  .transform((v) => (v === '' || v == null ? null : v));

const optionalShortText = (max) =>
  z
    .union([z.literal(''), z.string().max(max).trim()])
    .optional()
    .transform((v) => (v === '' || v == null ? null : v));

const optionalCodigo = z
  .union([
    z.literal(''),
    z
      .string()
      .min(1, 'Mínimo 1 carácter')
      .max(50)
      .regex(/^[a-zA-Z0-9._-]+$/, 'Solo letras, números, . _ -'),
  ])
  .optional()
  .transform((v) => (v === '' || v == null ? null : v.trim()));

export const productFormSchema = z
  .object({
    codigo: optionalCodigo,
    nombre: z.string().min(2, 'Mínimo 2 caracteres').max(150),
    descripcion: z.string().max(2000).optional().or(z.literal('')),
    imagen_url: optionalUrl,
    color: optionalShortText(50),
    talle: optionalShortText(30),
    categoria_id: z.coerce.number().positive('Seleccione una categoría'),
    precio_venta: z.coerce.number().min(0, 'No puede ser negativo'),
    venta_por_paquete: z.boolean().optional().default(false),
    precio_venta_paquete: z.coerce.number().min(0, 'No puede ser negativo').optional().default(0),
    unidades_por_paquete: z.coerce
      .number()
      .min(0.001, 'Debe ser mayor a 0')
      .optional()
      .default(1),
    precio_costo: z.coerce.number().min(0, 'No puede ser negativo'),
    stock: z.coerce.number().min(0, 'No puede ser negativo').optional().default(0),
    stock_minimo: z.coerce.number().min(0, 'No puede ser negativo'),
    unidad_medida: z.enum(unidades, { message: 'Seleccione una unidad' }),
    estado: z.enum(['activo', 'inactivo']),
  })
  .superRefine((data, ctx) => {
    if (data.venta_por_paquete) {
      if (!data.precio_venta_paquete || data.precio_venta_paquete <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Indique el precio del paquete',
          path: ['precio_venta_paquete'],
        });
      }
      if (!data.unidades_por_paquete || data.unidades_por_paquete <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Indique cuántas unidades trae el paquete',
          path: ['unidades_por_paquete'],
        });
      }
    }
  });

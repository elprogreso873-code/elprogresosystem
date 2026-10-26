import { z } from 'zod';

const emptyToNull = (val) => {
  if (val === '' || val === undefined) return null;
  return val;
};

export const createSupplierSchema = z.object({
  nombre: z.string().min(2).max(150).trim(),
  cuit: z.preprocess(emptyToNull, z.string().max(20).nullable().optional()),
  email: z.preprocess(
    emptyToNull,
    z.union([z.null(), z.string().email('Email inválido').max(120)]).optional()
  ),
  telefono: z.preprocess(emptyToNull, z.string().max(30).nullable().optional()),
  direccion: z.preprocess(emptyToNull, z.string().max(255).nullable().optional()),
  observaciones: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
  estado: z.enum(['activo', 'inactivo']).optional().default('activo'),
});

export const updateSupplierSchema = z
  .object({
    nombre: z.string().min(2).max(150).trim().optional(),
    cuit: z.preprocess(emptyToNull, z.string().max(20).nullable().optional()),
    email: z.preprocess(
      emptyToNull,
      z.union([z.null(), z.string().email().max(120)]).optional()
    ),
    telefono: z.preprocess(emptyToNull, z.string().max(30).nullable().optional()),
    direccion: z.preprocess(emptyToNull, z.string().max(255).nullable().optional()),
    observaciones: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
    estado: z.enum(['activo', 'inactivo']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe enviar al menos un campo para actualizar',
  });

export const listSuppliersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().max(100).optional().default(''),
  estado: z.enum(['activo', 'inactivo', 'todos']).optional().default('todos'),
  solo_deuda: z
    .preprocess((v) => v === 'true' || v === true || v === '1' || v === 1, z.boolean())
    .optional()
    .default(false),
});

export const supplierPaymentSchema = z.object({
  monto: z.coerce.number().positive('El monto debe ser mayor a 0'),
  metodo_pago: z.string().min(1).max(50).trim().optional().default('efectivo'),
  paga_con_caja: z.coerce.boolean().optional().default(false),
  compra_id: z.coerce.number().int().positive().optional(),
  observaciones: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
});

export const supplierMovementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(15),
});

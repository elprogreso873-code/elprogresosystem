import { z } from 'zod';
import { optionalDateFilter, withDateRangeRefine } from './common.validation.js';

const emptyToNull = (val) => {
  if (val === '' || val === undefined) return null;
  return val;
};

const purchaseLineSchema = z.object({
  producto_id: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().positive('Cantidad debe ser mayor a 0'),
  precio_costo: z.coerce.number().min(0).optional().default(0),
  precio_venta: z.preprocess(
    emptyToNull,
    z.union([z.null(), z.coerce.number().min(0)]).optional()
  ),
  actualizar_precios: z.coerce.boolean().optional().default(false),
});

export const createPurchaseSchema = z.object({
  proveedor_id: z.coerce.number().int().positive('Seleccione un proveedor'),
  observaciones: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
  items: z.array(purchaseLineSchema).min(1, 'Debe incluir al menos un producto'),
  total_manual: z.preprocess(
    emptyToNull,
    z.union([z.null(), z.coerce.number().min(0)]).optional()
  ),
  pagada: z.coerce.boolean().optional().default(false),
  monto_pagado: z.preprocess(
    emptyToNull,
    z.union([z.null(), z.coerce.number().min(0)]).optional()
  ),
  paga_con_caja: z.coerce.boolean().optional().default(false),
  metodo_pago: z.string().min(1).max(50).trim().optional().default('efectivo'),
});

export const listPurchasesQuerySchema = withDateRangeRefine(
  z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().max(100).optional().default(''),
    estado: z.enum(['completada', 'anulada', 'todos']).optional().default('todos'),
    estado_pago: z.enum(['pagada', 'parcial', 'pendiente', 'todos']).optional().default('todos'),
    proveedor_id: z.coerce.number().int().positive().optional(),
    fecha_desde: optionalDateFilter,
    fecha_hasta: optionalDateFilter,
  })
);

export const purchasesSummaryQuerySchema = withDateRangeRefine(
  z.object({
    fecha_desde: optionalDateFilter,
    fecha_hasta: optionalDateFilter,
    proveedor_id: z.coerce.number().int().positive().optional(),
  })
);

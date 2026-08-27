import { z } from 'zod';

export const paymentMethodFormSchema = z.object({
  codigo: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guión bajo'),
  nombre: z.string().min(2, 'Nombre requerido').max(100),
  descripcion: z.string().max(255).optional().or(z.literal('')),
  requiere_cliente: z.boolean().optional().default(false),
  requiere_monto_recibido: z.boolean().optional().default(false),
  registra_en_caja: z.boolean().optional().default(false),
  genera_cargo_cc: z.boolean().optional().default(false),
  es_predeterminado: z.boolean().optional().default(false),
  orden: z.coerce.number().int().min(0).max(9999).optional().default(0),
  estado: z.enum(['activo', 'inactivo']).optional().default('activo'),
});

export const paymentMethodEditSchema = paymentMethodFormSchema.omit({ codigo: true });

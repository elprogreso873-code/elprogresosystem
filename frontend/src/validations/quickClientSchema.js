import { z } from 'zod';

export const quickClientFormSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(150).trim(),
  telefono: z.string().max(30).optional().or(z.literal('')),
  numero_documento: z.string().max(20).optional().or(z.literal('')),
  limite_credito: z
    .union([z.literal(''), z.null(), z.coerce.number().min(0)])
    .optional()
    .transform((v) => (v === '' || v == null || v === undefined ? null : v)),
});

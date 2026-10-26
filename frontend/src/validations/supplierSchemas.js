import { z } from 'zod';

export const supplierFormSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(150),
  cuit: z.string().max(20).optional().or(z.literal('')),
  email: z.union([z.literal(''), z.string().email('Email inválido')]).optional(),
  telefono: z.string().max(30).optional().or(z.literal('')),
  direccion: z.string().max(255).optional().or(z.literal('')),
  observaciones: z.string().max(500).optional().or(z.literal('')),
  estado: z.enum(['activo', 'inactivo']),
});

export const quickSupplierFormSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(150),
  telefono: z.string().max(30).optional().or(z.literal('')),
  cuit: z.string().max(20).optional().or(z.literal('')),
});

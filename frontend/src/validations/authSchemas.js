import { z } from 'zod';

export const loginSchema = z.object({
  nombre_usuario: z
    .string()
    .min(1, 'El usuario es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(60, 'Máximo 60 caracteres'),
  contrasena: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(6, 'Mínimo 6 caracteres'),
});

export const userFormSchema = z.object({
  nombre_usuario: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(60, 'Máximo 60 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Solo letras, números, . _ -'),
  contrasena: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      'Debe incluir mayúscula, minúscula y número'
    )
    .optional()
    .or(z.literal('')),
  rol_id: z.coerce.number().positive('Seleccione un rol'),
  estado: z.enum(['activo', 'inactivo']),
});

export const createUserSchema = userFormSchema.extend({
  contrasena: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
      'Debe incluir mayúscula, minúscula y número'
    ),
});

export const updateUserSchema = userFormSchema
  .partial()
  .extend({
    nombre_usuario: z
      .string()
      .min(3)
      .max(60)
      .regex(/^[a-zA-Z0-9_.-]+$/)
      .optional(),
    rol_id: z.coerce.number().positive().optional(),
    estado: z.enum(['activo', 'inactivo']).optional(),
  })
  .refine(
    (data) =>
      data.nombre_usuario ||
      data.contrasena ||
      data.rol_id ||
      data.estado,
    { message: 'Modifique al menos un campo' }
  );

import { z } from 'zod';
import { PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_REGEX } from './passwordPolicy';

export const strongPasswordSchema = z
  .string()
  .min(12, PASSWORD_POLICY_MESSAGE)
  .regex(PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE);

export const loginSchema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Ingresa un correo válido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().min(1, 'Ingresa tu correo').email('Ingresa un correo válido'),
  password: strongPasswordSchema,
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Ingresa tu correo').email('Ingresa un correo válido'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token de recuperación no encontrado'),
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().min(1, 'Ingresa tu correo').email('Ingresa un correo válido'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const cardSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastFourDigits: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Ingresa exactamente 4 dígitos'),
  cutOffDay: z.coerce
    .number()
    .int('Ingresa un día válido')
    .min(1, 'El día debe estar entre 1 y 31')
    .max(31, 'El día debe estar entre 1 y 31'),
  paymentDeadlineDay: z.coerce
    .number()
    .int('Ingresa un día válido')
    .min(1, 'El día debe estar entre 1 y 31')
    .max(31, 'El día debe estar entre 1 y 31'),
  bankProfileId: z.string().optional(),
}).refine((values) => values.cutOffDay !== values.paymentDeadlineDay, {
  message: 'El día de corte y el día de pago no pueden ser iguales',
  path: ['paymentDeadlineDay'],
});

export const expenseFormSchema = z.object({
  cardId: z.string().min(1, 'Selecciona una tarjeta'),
  userId: z.string().optional(),
  concept: z.string().trim().min(1, 'Ingresa un concepto'),
  amount: z.string().optional(),
  totalAmount: z.string().optional(),
  transactionDate: z.string().min(1, 'Selecciona una fecha'),
  totalInstallments: z.string().optional(),
  recurringMonths: z.string().optional(),
});

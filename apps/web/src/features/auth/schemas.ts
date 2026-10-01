import { z } from 'zod'
import { containsOffensive, OFFENSIVE_MESSAGE } from '@/lib/offensive'
import { PROVINCIAS } from '@/lib/provincias'

export const MIN_AGE = 14

export const emailSchema = z.email('Introduce un email válido')
export const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(72, 'Máximo 72 caracteres')

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Introduce tu contraseña'),
})

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Mínimo 3 caracteres')
  .max(20, 'Máximo 20 caracteres')
  .regex(/^[a-z0-9_]+$/, 'Solo letras minúsculas, números y _')

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Escribe tu nombre')
  .max(50, 'Máximo 50 caracteres')
  .refine((v) => !containsOffensive(v), OFFENSIVE_MESSAGE)

const provinciaCodes = PROVINCIAS.map((p) => p.code) as [string, ...string[]]

/** Edad cumplida en una fecha dada (por defecto, hoy). */
export function ageOn(birthdate: Date, today = new Date()) {
  let age = today.getFullYear() - birthdate.getFullYear()
  const m = today.getMonth() - birthdate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) age--
  return age
}

export const onboardingSchema = z.object({
  username: usernameSchema,
  display_name: displayNameSchema,
  provincia: z.enum(provinciaCodes, { error: 'Elige tu provincia' }),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Introduce tu fecha de nacimiento')
    .refine((v) => {
      const d = new Date(`${v}T00:00:00`)
      return !Number.isNaN(d.getTime()) && d.getFullYear() > 1900 && d < new Date()
    }, 'Fecha no válida')
    .refine(
      (v) => ageOn(new Date(`${v}T00:00:00`)) >= MIN_AGE,
      `Debes tener al menos ${MIN_AGE} años para usar FachApp`,
    ),
  accept: z.literal(true, { error: 'Debes aceptar las normas y la política de privacidad' }),
})

export const profileSchema = z.object({
  display_name: displayNameSchema,
  bio: z
    .string()
    .max(160, 'Máximo 160 caracteres')
    .refine((v) => !containsOffensive(v), OFFENSIVE_MESSAGE),
  provincia: z.enum(provinciaCodes, { error: 'Elige tu provincia' }),
})

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type OnboardingValues = z.input<typeof onboardingSchema>
export type ProfileValues = z.infer<typeof profileSchema>

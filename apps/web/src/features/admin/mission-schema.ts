import { z } from 'zod'
import { parseRule, RuleError } from '@shared/rules'
import type { Mission, MissionInsert } from '@/lib/types'

export const missionFormSchema = z
  .object({
    title: z.string().trim().min(3, 'Mínimo 3 caracteres').max(80, 'Máximo 80 caracteres'),
    description: z.string().trim().max(1000, 'Máximo 1000 caracteres'),
    category: z.string().trim().min(2, 'Indica una categoría').max(40),
    difficulty: z.enum(['facil', 'media', 'dificil']),
    points: z.coerce
      .number<string>()
      .int('Debe ser un entero')
      .min(1, 'Mínimo 1')
      .max(10000, 'Máximo 10.000'),
    verification_type: z.enum(['x_auto', 'photo', 'manual']),
    rules: z.string(),
    starts_at: z.string(),
    ends_at: z.string(),
    cover_image: z
      .string()
      .trim()
      .refine((v) => !v || /^https?:\/\//.test(v) || v.startsWith('covers/'), 'URL no válida'),
    active: z.boolean(),
    featured: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.verification_type === 'x_auto') {
      try {
        parseRule(JSON.parse(v.rules || '{}'))
      } catch (e) {
        ctx.addIssue({
          code: 'custom',
          path: ['rules'],
          message: e instanceof RuleError ? e.message : 'JSON no válido',
        })
      }
    }
    if (v.starts_at && v.ends_at && new Date(v.ends_at) <= new Date(v.starts_at)) {
      ctx.addIssue({ code: 'custom', path: ['ends_at'], message: 'Debe ser posterior al inicio' })
    }
  })

export type MissionFormInput = z.input<typeof missionFormSchema>
export type MissionFormValues = z.output<typeof missionFormSchema>

const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : '')

export function missionToForm(m?: Mission): MissionFormInput {
  return {
    title: m?.title ?? '',
    description: m?.description ?? '',
    category: m?.category ?? 'general',
    difficulty: m?.difficulty ?? 'facil',
    points: String(m?.points ?? 50),
    verification_type: m?.verification_type ?? 'photo',
    rules:
      m && m.verification_type === 'x_auto'
        ? JSON.stringify(m.rules, null, 2)
        : '{\n  "type": "post_with_hashtag",\n  "hashtag": "#FachApp"\n}',
    starts_at: toLocalInput(m?.starts_at ?? null),
    ends_at: toLocalInput(m?.ends_at ?? null),
    cover_image: m?.cover_image ?? '',
    active: m?.active ?? true,
    featured: m?.featured ?? false,
  }
}

export function formToMission(v: MissionFormValues): Omit<MissionInsert, 'id' | 'created_by'> {
  return {
    title: v.title,
    description: v.description,
    category: v.category.toLowerCase(),
    difficulty: v.difficulty,
    points: v.points,
    verification_type: v.verification_type,
    rules: v.verification_type === 'x_auto' ? parseRule(JSON.parse(v.rules)) : {},
    starts_at: v.starts_at ? new Date(v.starts_at).toISOString() : null,
    ends_at: v.ends_at ? new Date(v.ends_at).toISOString() : null,
    cover_image: v.cover_image || null,
    active: v.active,
    featured: v.featured,
  }
}

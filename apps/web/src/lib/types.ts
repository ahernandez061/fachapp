import type { Database } from './database.types'

type Tables = Database['public']['Tables']
type Views = Database['public']['Views']
type Fns = Database['public']['Functions']

export type Profile = Tables['profiles']['Row']
export type Mission = Tables['missions']['Row']
export type MissionInsert = Tables['missions']['Insert']
export type MissionAttempt = Tables['mission_attempts']['Row']
export type Post = Tables['posts']['Row']
export type Comment = Tables['comments']['Row']
export type Notification = Tables['notifications']['Row']
export type Report = Tables['reports']['Row']
export type Badge = Tables['badges']['Row']
export type Provincia = Tables['provincias']['Row']
export type FeedPost = Views['post_feed']['Row']
export type LeaderboardRow = Fns['get_leaderboard']['Returns'][number]
export type ProfileStats = Fns['get_profile_stats']['Returns'][number]

export type VerificationType = Database['public']['Enums']['verification_type']
export type AttemptStatus = Database['public']['Enums']['attempt_status']
export type Difficulty = Database['public']['Enums']['mission_difficulty']
export type ReportTarget = Database['public']['Enums']['report_target']

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facil: 'Fácil',
  media: 'Media',
  dificil: 'Difícil',
}

export const VERIFICATION_LABEL: Record<VerificationType, string> = {
  x_auto: 'Automática con X',
  photo: 'Foto',
  manual: 'Revisión manual',
}

export const REPORT_REASONS = {
  spam: 'Spam',
  acoso: 'Acoso o intimidación',
  odio: 'Discurso de odio',
  contenido_sexual: 'Contenido sexual',
  violencia: 'Violencia',
  suplantacion: 'Suplantación de identidad',
  otro: 'Otro motivo',
} as const

export type ReportReason = keyof typeof REPORT_REASONS

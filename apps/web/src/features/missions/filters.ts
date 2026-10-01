import type { Difficulty, Mission, MissionAttempt, VerificationType } from '@/lib/types'

export type MissionFilters = {
  q: string
  category: string
  difficulty: Difficulty | ''
  type: VerificationType | ''
  status: '' | 'todo' | 'pending' | 'done'
}

export const EMPTY_FILTERS: MissionFilters = {
  q: '',
  category: '',
  difficulty: '',
  type: '',
  status: '',
}

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

export function filterMissions(
  missions: Mission[],
  attempts: Map<string, Pick<MissionAttempt, 'status'>>,
  f: MissionFilters,
) {
  const q = normalize(f.q.trim())
  return missions.filter((m) => {
    if (q && !normalize(`${m.title} ${m.description} ${m.category}`).includes(q)) return false
    if (f.category && m.category !== f.category) return false
    if (f.difficulty && m.difficulty !== f.difficulty) return false
    if (f.type && m.verification_type !== f.type) return false
    const status = attempts.get(m.id)?.status
    if (f.status === 'done' && status !== 'verified') return false
    if (f.status === 'pending' && status !== 'pending') return false
    if (f.status === 'todo' && (status === 'verified' || status === 'pending')) return false
    return true
  })
}

export function categoriesOf(missions: Mission[]) {
  return [...new Set(missions.map((m) => m.category))].sort((a, b) => a.localeCompare(b, 'es'))
}

/** ¿Está la misión disponible ahora mismo? */
export function missionAvailability(m: Pick<Mission, 'starts_at' | 'ends_at'>, now = new Date()) {
  if (m.starts_at && now < new Date(m.starts_at)) return 'upcoming' as const
  if (m.ends_at && now > new Date(m.ends_at)) return 'ended' as const
  return 'open' as const
}

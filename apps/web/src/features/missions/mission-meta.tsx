import { Camera, CheckCircle2, Clock, Hand, XCircle } from 'lucide-react'
import { XIcon } from '@/features/auth/oauth-buttons'
import { Badge } from '@/components/ui/badge'
import type { AttemptStatus, Mission, MissionAttempt, VerificationType } from '@/lib/types'
import { DIFFICULTY_LABEL } from '@/lib/types'

export function VerificationIcon({
  type,
  className = 'size-3.5',
}: {
  type: VerificationType
  className?: string
}) {
  if (type === 'x_auto') return <XIcon className={className} />
  if (type === 'photo') return <Camera className={className} aria-hidden />
  return <Hand className={className} aria-hidden />
}

export function DifficultyBadge({ mission }: { mission: Pick<Mission, 'difficulty'> }) {
  const variant =
    mission.difficulty === 'dificil'
      ? 'destructive'
      : mission.difficulty === 'media'
        ? 'warning'
        : 'secondary'
  return <Badge variant={variant}>{DIFFICULTY_LABEL[mission.difficulty]}</Badge>
}

const STATUS: Record<
  AttemptStatus,
  { label: string; xLabel?: string; variant: 'success' | 'warning' | 'destructive' }
> = {
  verified: { label: 'Completada', variant: 'success' },
  pending: { label: 'En revisión', variant: 'warning' },
  rejected: { label: 'Rechazada', xLabel: 'Aún no cumplida', variant: 'destructive' },
}

export function AttemptBadge({
  attempt,
  type,
}: {
  attempt: Pick<MissionAttempt, 'status'> | undefined
  type: VerificationType
}) {
  if (!attempt) return null
  const s = STATUS[attempt.status]
  const Icon =
    attempt.status === 'verified' ? CheckCircle2 : attempt.status === 'pending' ? Clock : XCircle
  return (
    <Badge variant={s.variant}>
      <Icon aria-hidden /> {type === 'x_auto' && s.xLabel ? s.xLabel : s.label}
    </Badge>
  )
}

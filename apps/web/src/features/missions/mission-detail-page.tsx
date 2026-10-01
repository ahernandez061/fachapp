import { ArrowLeft, CalendarClock, Camera, Hand, Info, RefreshCw } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { StorageImage } from '@/components/storage-image'
import { ErrorState, PageLoader, Spinner } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useMyProfile } from '@/features/auth/session'
import { XIcon } from '@/features/auth/oauth-buttons'
import { formatDate, formatDateTime, formatNumber } from '@/lib/i18n'
import { VERIFICATION_LABEL } from '@/lib/types'
import { describeRule, parseRule, type RuleResult } from '@shared/rules'
import { missionAvailability } from './filters'
import { useAttemptVotes } from '@/features/validate/api'
import { VoteProgress } from '@/features/validate/vote-progress'
import { useMission, useMyAttempts, useVerifyX, VerifyError } from './api'
import { AttemptBadge, DifficultyBadge, VerificationIcon } from './mission-meta'

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = Math.min(100, Math.round((current / Math.max(target, 1)) * 100))
  return (
    <div className="grid gap-1">
      <div
        className="h-2.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label="Progreso de la misión"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-right text-xs text-muted-foreground">
        {formatNumber(current)} / {formatNumber(target)}
      </p>
    </div>
  )
}

export function MissionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const mission = useMission(id)
  const attempts = useMyAttempts()
  const { data: profile } = useMyProfile()
  const verify = useVerifyX()
  // Votos de la comunidad (solo si mi prueba está pendiente)
  const myAttempt = mission.data ? attempts.data?.get(mission.data.id) : undefined
  const { data: votes } = useAttemptVotes(
    myAttempt?.status === 'pending' ? myAttempt.id : undefined,
  )

  if (mission.isLoading) return <PageLoader />
  if (mission.error || !mission.data)
    return <ErrorState error={mission.error ?? 'Misión no encontrada'} />

  const m = mission.data
  const attempt = attempts.data?.get(m.id)
  const availability = missionAvailability(m)
  const evidence = (attempt?.evidence ?? {}) as Partial<RuleResult & { checked_at: string }>
  let ruleText: string | null = null
  if (m.verification_type === 'x_auto') {
    try {
      ruleText = describeRule(parseRule(m.rules))
    } catch {
      ruleText = 'Regla no válida: avisa a un administrador.'
    }
  }

  async function onVerify() {
    try {
      const r = await verify.mutateAsync(m.id)
      if (r.status === 'verified') toast.success(`¡Misión completada! +${m.points} puntos 🎉`)
      else toast.info(r.result?.detail ?? 'Todavía no cumples la misión')
    } catch (e) {
      if (e instanceof VerifyError && e.code === 'x_not_connected') {
        toast.info('Primero conecta tu cuenta de X')
        navigate(`/conectar-x?mision=${m.id}`)
      } else {
        toast.error((e as Error).message)
      }
    }
  }

  return (
    <article className="grid gap-4">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => navigate(-1)}>
        <ArrowLeft /> Volver
      </Button>
      <StorageImage path={m.cover_image} alt="" className="aspect-video w-full rounded-xl" />
      <div className="grid gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge mission={m} />
          <span className="text-sm text-muted-foreground capitalize">{m.category}</span>
          <AttemptBadge attempt={attempt} type={m.verification_type} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{m.title}</h1>
        <p className="text-3xl font-extrabold text-primary">+{formatNumber(m.points)} pts</p>
        <p className="whitespace-pre-line text-muted-foreground">{m.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <VerificationIcon type={m.verification_type} className="size-4" />
            {VERIFICATION_LABEL[m.verification_type]}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          {ruleText && <p>{ruleText}</p>}
          {m.verification_type === 'photo' && (
            <p>
              Sube una foto como prueba. La comunidad la votará: con 5 votos a favor, reto superado.
            </p>
          )}
          {m.verification_type === 'manual' && (
            <p>
              Cuéntanos cómo la completaste. La comunidad lo votará: con 5 votos a favor, reto
              superado.
            </p>
          )}
          {(m.starts_at || m.ends_at) && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="size-4" aria-hidden />
              {m.starts_at && `Desde el ${formatDate(m.starts_at)}`}{' '}
              {m.ends_at && `hasta el ${formatDate(m.ends_at)}`}
            </p>
          )}
          {m.verification_type === 'x_auto' && evidence.target !== undefined && (
            <div className="grid gap-1">
              <ProgressBar current={evidence.current ?? 0} target={evidence.target} />
              {evidence.checked_at && (
                <p className="text-xs text-muted-foreground">
                  Última comprobación: {formatDateTime(evidence.checked_at)}
                </p>
              )}
            </div>
          )}
          {attempt?.status === 'rejected' && attempt.review_note && (
            <p className="flex gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
              <Info className="size-4 shrink-0" aria-hidden /> Motivo: {attempt.review_note}
            </p>
          )}
        </CardContent>
      </Card>

      {availability !== 'open' ? (
        <p className="rounded-md bg-muted p-3 text-center text-sm">
          {availability === 'upcoming'
            ? 'Esta misión todavía no ha empezado.'
            : 'Esta misión ya ha terminado.'}
        </p>
      ) : attempt?.status === 'verified' ? (
        <p className="rounded-md bg-emerald-600/10 p-3 text-center text-sm font-medium text-emerald-700 dark:text-emerald-400">
          ¡Ya completaste esta misión!
        </p>
      ) : attempt?.status === 'pending' ? (
        <div className="grid gap-2 rounded-md bg-amber-400/15 p-3 text-sm">
          <p className="text-center">
            Tu prueba está en revisión: la está votando la comunidad. Te avisaremos.
          </p>
          {votes && (
            <VoteProgress
              approvals={votes.approvals}
              rejections={votes.rejections}
              approvalsNeeded={votes.approvals_needed}
              rejectionsNeeded={votes.rejections_needed}
            />
          )}
        </div>
      ) : m.verification_type === 'x_auto' ? (
        <div className="grid gap-2">
          <Button size="lg" onClick={onVerify} disabled={verify.isPending}>
            {verify.isPending ? <Spinner /> : attempt ? <RefreshCw /> : <XIcon />}
            {attempt ? 'Volver a verificar' : 'Verificar con X'}
          </Button>
          {!profile?.x_connected && (
            <p className="text-center text-xs text-muted-foreground">
              Necesitas{' '}
              <Link to={`/conectar-x?mision=${m.id}`} className="underline">
                conectar tu cuenta de X
              </Link>{' '}
              (solo lectura).
            </p>
          )}
        </div>
      ) : (
        <Button size="lg" asChild>
          <Link to={`/subir?mision=${m.id}`}>
            {m.verification_type === 'photo' ? <Camera /> : <Hand />}
            {m.verification_type === 'photo' ? 'Subir foto' : 'Enviar para revisión'}
          </Link>
        </Button>
      )}
    </article>
  )
}

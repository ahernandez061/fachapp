import { useQueryClient } from '@tanstack/react-query'
import { Check, PartyPopper, SkipForward, ThumbsUp, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { EmptyState } from '@/components/empty-state'
import { PageHeader } from '@/components/page-header'
import { StorageImage } from '@/components/storage-image'
import { ErrorState, PageLoader } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUserId } from '@/features/auth/session'
import { VerificationIcon } from '@/features/missions/mission-meta'
import { errorMessage } from '@/lib/errors'
import { formatNumber, formatRelative } from '@/lib/i18n'
import { VERIFICATION_LABEL } from '@/lib/types'
import { useValidationQueue, useVote, validateKeys } from './api'
import { VoteProgress } from './vote-progress'

/**
 * Validación por la comunidad: enseña pruebas de otros usuarios al azar y cada uno
 * vota si sirven para el reto. 5 votos a favor → superado; 10 en contra → fallido.
 */
export function ValidatePage() {
  const uid = useUserId()
  const qc = useQueryClient()
  const queue = useValidationQueue()
  const vote = useVote()
  const [done, setDone] = useState<Set<string>>(new Set())
  const [votedCount, setVotedCount] = useState(0)

  if (queue.isLoading) return <PageLoader />
  if (queue.error) return <ErrorState error={queue.error} onRetry={() => queue.refetch()} />

  const pending = (queue.data ?? []).filter((i) => !done.has(i.attempt_id))
  const item = pending[0]

  function next(id: string) {
    setDone((s) => new Set(s).add(id))
  }

  function reload() {
    setDone(new Set())
    qc.invalidateQueries({ queryKey: validateKeys.queue(uid) })
  }

  async function onVote(approve: boolean) {
    if (!item) return
    try {
      const r = await vote.mutateAsync({ attemptId: item.attempt_id, approve })
      setVotedCount((n) => n + 1)
      if (r?.status === 'verified') toast.success('¡Con tu voto el reto queda superado! 🎉')
      else if (r?.status === 'rejected') toast.info('Con tu voto la prueba queda como fallida.')
      else toast(approve ? 'Voto a favor registrado 👍' : 'Voto en contra registrado 👎')
    } catch (e) {
      toast.error(errorMessage(e))
    }
    next(item.attempt_id)
  }

  return (
    <>
      <PageHeader title="Validar retos" />
      <p className="mb-4 text-sm text-muted-foreground">
        ¿Esta prueba sirve para el reto? Con <strong>5 votos a favor</strong> se da por superado y
        con <strong>10 en contra</strong>, por fallido. Vota con honestidad: mañana te toca a ti.
      </p>

      {!item ? (
        <EmptyState
          icon={votedCount ? PartyPopper : ThumbsUp}
          title={
            votedCount ? `¡Gracias! Has votado ${votedCount} pruebas` : 'No hay pruebas pendientes'
          }
          description="Vuelve más tarde: cada día la gente sube nuevas pruebas."
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={reload}>
                Buscar más
              </Button>
              <Button asChild>
                <Link to="/misiones">Ir a misiones</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <Card
            className="gap-0 overflow-hidden py-0"
            aria-label={`Prueba para el reto ${item.mission_title}`}
          >
            {item.photo_url ? (
              <StorageImage
                path={item.photo_url}
                alt={`Prueba para el reto ${item.mission_title}`}
                className="aspect-square w-full"
              />
            ) : (
              <div className="grid aspect-[3/1] place-items-center bg-accent text-sm text-accent-foreground">
                <span className="flex items-center gap-2">
                  <VerificationIcon type={item.verification_type} className="size-4" /> Prueba sin
                  foto
                </span>
              </div>
            )}
            <CardContent className="grid gap-3 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <VerificationIcon type={item.verification_type} />{' '}
                  {VERIFICATION_LABEL[item.verification_type]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Enviada {formatRelative(item.created_at)} · {pending.length} en cola
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold">{item.mission_title}</h2>
                <p className="text-sm text-muted-foreground">{item.mission_description}</p>
                <p className="mt-1 text-sm font-semibold text-primary">
                  +{formatNumber(item.mission_points)} pts para quien lo consiga
                </p>
              </div>
              {item.note && (
                <blockquote className="rounded-md border-l-4 border-primary bg-muted/60 p-3 text-sm italic">
                  “{item.note}”
                </blockquote>
              )}
              <VoteProgress approvals={item.approvals} rejections={item.rejections} />
            </CardContent>
          </Card>
          <div
            // Siempre visible justo encima de la barra de navegación inferior.
            className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[5] mt-3 grid grid-cols-[1fr_auto_1fr] gap-2 rounded-xl border bg-background/95 p-2 shadow-lg backdrop-blur"
            role="group"
            aria-label="Tu voto"
          >
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={vote.isPending}
              onClick={() => onVote(false)}
            >
              <X /> No vale
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={vote.isPending}
              onClick={() => next(item.attempt_id)}
              aria-label="Saltar"
              title="Saltar"
            >
              <SkipForward />
            </Button>
            <Button
              className="bg-emerald-700 text-white hover:bg-emerald-800"
              disabled={vote.isPending}
              onClick={() => onVote(true)}
            >
              <Check /> Reto superado
            </Button>
          </div>
        </>
      )}
    </>
  )
}

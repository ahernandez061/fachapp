import { CloudOff, Loader2 } from 'lucide-react'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/lib/errors'

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={CloudOff}
      title="Vaya, algo ha fallado"
      description={errorMessage(error)}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        )
      }
    />
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={className ?? 'size-5 animate-spin'} aria-hidden />
}

export function PageLoader() {
  return (
    <div className="grid min-h-[50dvh] place-items-center" role="status" aria-live="polite">
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Cargando…</span>
    </div>
  )
}

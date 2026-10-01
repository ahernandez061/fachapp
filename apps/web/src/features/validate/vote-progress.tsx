import { cn } from '@/lib/utils'

type Props = {
  approvals: number
  rejections: number
  approvalsNeeded?: number
  rejectionsNeeded?: number
  className?: string
}

/** Barras de progreso de la votación: X/5 a favor, Y/10 en contra. */
export function VoteProgress({
  approvals,
  rejections,
  approvalsNeeded = 5,
  rejectionsNeeded = 10,
  className,
}: Props) {
  const rows = [
    { label: 'Superado', value: approvals, max: approvalsNeeded, color: 'bg-emerald-600' },
    { label: 'No vale', value: rejections, max: rejectionsNeeded, color: 'bg-destructive' },
  ]
  return (
    <div className={cn('grid gap-1.5 text-xs', className)}>
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-2">
          <span className="text-muted-foreground">{r.label}</span>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`Votos "${r.label}"`}
            aria-valuenow={r.value}
            aria-valuemin={0}
            aria-valuemax={r.max}
          >
            <div
              className={cn('h-full rounded-full transition-all', r.color)}
              style={{ width: `${Math.min(100, (r.value / r.max) * 100)}%` }}
            />
          </div>
          <span className="text-right font-medium tabular-nums">
            {r.value}/{r.max}
          </span>
        </div>
      ))}
    </div>
  )
}

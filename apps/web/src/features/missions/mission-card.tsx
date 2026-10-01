import { Link } from 'react-router'
import { StorageImage } from '@/components/storage-image'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/i18n'
import type { Mission, MissionAttempt } from '@/lib/types'
import { VERIFICATION_LABEL } from '@/lib/types'
import { AttemptBadge, DifficultyBadge, VerificationIcon } from './mission-meta'

export function MissionCard({ mission, attempt }: { mission: Mission; attempt?: MissionAttempt }) {
  return (
    <Link
      to={`/misiones/${mission.id}`}
      className="group flex overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <StorageImage path={mission.cover_image} className="h-auto w-28 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="leading-tight font-semibold">{mission.title}</h3>
          <span className="shrink-0 text-sm font-bold text-primary">
            +{formatNumber(mission.points)}
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{mission.description}</p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          <DifficultyBadge mission={mission} />
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <VerificationIcon type={mission.verification_type} />{' '}
            {VERIFICATION_LABEL[mission.verification_type]}
          </span>
          <AttemptBadge attempt={attempt} type={mission.verification_type} />
        </div>
      </div>
    </Link>
  )
}

export function MissionCardSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-xl border">
      <Skeleton className="h-28 w-28 rounded-none" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

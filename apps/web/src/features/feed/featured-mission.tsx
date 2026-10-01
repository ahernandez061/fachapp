import { Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { StorageImage } from '@/components/storage-image'
import { useFeaturedMission } from '@/features/explore/api'
import { useMyAttempts } from '@/features/missions/api'
import { formatNumber } from '@/lib/i18n'

/** Banner del "Reto de la semana" (misión con featured = true). */
export function FeaturedMission() {
  const { data: mission } = useFeaturedMission()
  const attempts = useMyAttempts()
  if (!mission) return null
  const done = attempts.data?.get(mission.id)?.status === 'verified'

  return (
    <Link
      to={`/misiones/${mission.id}`}
      className="relative block overflow-hidden rounded-xl shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      aria-label={`Reto de la semana: ${mission.title}`}
    >
      <StorageImage path={mission.cover_image} alt="" className="h-36 w-full" />
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 text-white">
        <span className="mb-1 inline-flex w-fit items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-950">
          <Sparkles className="size-3" aria-hidden /> Reto de la semana
        </span>
        <p className="text-lg leading-tight font-bold">{mission.title}</p>
        <p className="text-sm text-white/85">
          {done
            ? '¡Ya lo has completado! Mira qué ha hecho el resto 👀'
            : `+${formatNumber(mission.points)} pts · ¿Te atreves?`}
        </p>
      </div>
    </Link>
  )
}

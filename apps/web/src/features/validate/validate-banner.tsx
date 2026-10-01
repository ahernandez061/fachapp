import { ChevronRight, ThumbsUp } from 'lucide-react'
import { Link } from 'react-router'
import { usePendingValidationsCount } from './api'

/** Aviso "N pruebas esperan tu voto" que lleva a /validar. */
export function ValidateBanner() {
  const { data: count = 0 } = usePendingValidationsCount()
  if (!count) return null
  return (
    <Link
      to="/validar"
      className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-700/30 bg-emerald-700/10 p-3 text-sm hover:bg-emerald-700/15"
    >
      <ThumbsUp className="size-5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
      <span className="flex-1">
        <strong>
          {count} {count === 1 ? 'prueba espera' : 'pruebas esperan'} tu voto.
        </strong>{' '}
        Ayuda a decidir si superan el reto.
      </span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
    </Link>
  )
}

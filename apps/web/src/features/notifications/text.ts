import type { Notification } from '@/lib/types'

type P = Record<string, string | number | null | undefined>

/** Texto y enlace de cada tipo de notificación. */
export function notificationText(n: Pick<Notification, 'type' | 'payload'>): {
  title: string
  href: string
} {
  const p = (n.payload ?? {}) as P
  const actor = p.actor_name || (p.actor_username ? `@${p.actor_username}` : 'Alguien')
  switch (n.type) {
    case 'follow':
      return { title: `${actor} ha empezado a seguirte`, href: `/u/${p.actor_username}` }
    case 'like':
      return { title: `A ${actor} le gusta tu publicación`, href: `/p/${p.post_id}` }
    case 'comment':
      return { title: `${actor} ha comentado: “${p.comment ?? ''}”`, href: `/p/${p.post_id}` }
    case 'mention':
      return {
        title: `${actor} te ha mencionado: “${p.excerpt ?? ''}”`,
        href: `/p/${p.post_id}`,
      }
    case 'mission_verified':
      return {
        title: `¡Misión completada! “${p.mission_title}” (+${p.points} pts)`,
        href: `/misiones/${p.mission_id}`,
      }
    case 'mission_rejected':
      return {
        title: `Tu prueba de “${p.mission_title}” no se ha aceptado${p.note ? `: ${p.note}` : ''}`,
        href: `/misiones/${p.mission_id}`,
      }
    case 'badge':
      return { title: `Nueva insignia: ${p.badge_name} 🏅`, href: '/perfil' }
    default:
      return { title: 'Tienes una notificación nueva', href: '/notificaciones' }
  }
}

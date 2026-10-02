// Texto de las notificaciones push (TS puro: lo usan send-push y los tests).
// Mantener en línea con apps/web/src/features/notifications/text.ts.

export type PushNotification = { type: string; payload: Record<string, unknown> | null }
export type PushMessage = { title: string; body: string; link: string }

const str = (v: unknown) => (v === null || v === undefined ? '' : String(v))

export function pushMessage(n: PushNotification): PushMessage {
  const p = n.payload ?? {}
  const actor = str(p.actor_name) || (p.actor_username ? `@${str(p.actor_username)}` : 'Alguien')
  switch (n.type) {
    case 'follow':
      return {
        title: 'Nuevo seguidor',
        body: `${actor} ha empezado a seguirte`,
        link: `/u/${str(p.actor_username)}`,
      }
    case 'like':
      return {
        title: 'Me gusta',
        body: `A ${actor} le gusta tu publicación`,
        link: `/p/${str(p.post_id)}`,
      }
    case 'comment':
      return {
        title: 'Nuevo comentario',
        body: `${actor}: ${str(p.comment)}`,
        link: `/p/${str(p.post_id)}`,
      }
    case 'mention':
      return {
        title: 'Te han mencionado',
        body: `${actor}: ${str(p.excerpt)}`,
        link: `/p/${str(p.post_id)}`,
      }
    case 'mission_verified':
      return {
        title: '¡Misión completada! 🎉',
        body: `“${str(p.mission_title)}” · +${str(p.points)} puntos`,
        link: `/misiones/${str(p.mission_id)}`,
      }
    case 'mission_rejected':
      return {
        title: 'Prueba no aceptada',
        body: `“${str(p.mission_title)}”${p.note ? `: ${str(p.note)}` : ''}`,
        link: `/misiones/${str(p.mission_id)}`,
      }
    case 'badge':
      return { title: 'Nueva insignia 🏅', body: str(p.badge_name), link: '/perfil' }
    default:
      return { title: 'FachApp', body: 'Tienes una notificación nueva', link: '/notificaciones' }
  }
}

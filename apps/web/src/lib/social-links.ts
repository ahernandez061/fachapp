import { isNative } from './native'

// Enlaces y "compartir" con otras apps: Instagram, Gmail/email y la hoja de compartir
// del sistema (desde la que el usuario puede elegir Instagram, WhatsApp, etc.).

const IG_USERNAME = /^[a-z0-9._]{1,30}$/

/** Acepta "@usuario", "usuario" o una URL de instagram.com y devuelve el usuario (o null). */
export function normalizeInstagram(input: string | null | undefined): string | null {
  if (!input) return null
  let v = input.trim()
  if (!v) return null
  const url = v.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)/i)
  if (url) v = url[1]
  v = v.replace(/^@/, '').toLowerCase()
  return IG_USERNAME.test(v) ? v : null
}

export function instagramUrl(username: string) {
  return `https://www.instagram.com/${encodeURIComponent(username)}/`
}

/** URL pública de la app (raíz + ruta del HashRouter). */
export function appUrl(path = '/') {
  return `${window.location.origin}${import.meta.env.BASE_URL}#${path}`
}

export const postUrl = (id: string) => appUrl(`/p/${id}`)
export const profileUrl = (username: string) => appUrl(`/u/${username}`)

/** Redacción de Gmail en el navegador con asunto y cuerpo rellenos. */
export function gmailComposeUrl({
  to = '',
  subject,
  body,
}: {
  to?: string
  subject: string
  body: string
}) {
  const p = new URLSearchParams({ view: 'cm', fs: '1', to, su: subject, body })
  return `https://mail.google.com/mail/?${p}`
}

/** Enlace mailto: para cualquier app de correo. */
export function mailtoUrl({
  to = '',
  subject,
  body,
}: {
  to?: string
  subject: string
  body: string
}) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function inviteMessage(inviter?: string | null) {
  const url = appUrl('/bienvenida')
  return {
    subject: '¡Únete a FachApp! 🇪🇸',
    body: `${inviter ? `${inviter} te invita a FachApp` : 'Te invito a FachApp'}: la red social de retos de España. Foto con la bandera, tortilla con o sin cebolla, el Camino de Santiago… ¿te apuntas?\n\n${url}`,
    url,
  }
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'unsupported'

type ShareInput = { title: string; text: string; url: string; imageUrl?: string | null }

/**
 * Comparte con la hoja del sistema (en el móvil incluye Instagram si está instalada).
 * Si se puede, adjunta la foto para que Instagram la reciba. Si no hay hoja de
 * compartir, copia el enlace al portapapeles.
 */
export async function share({ title, text, url, imageUrl }: ShareInput): Promise<ShareResult> {
  // App nativa: hoja de compartir de Android/iOS (incluye Instagram, WhatsApp…).
  if (isNative()) {
    try {
      const { Share } = await import('@capacitor/share')
      await Share.share({ title, text, url, dialogTitle: 'Compartir' })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (typeof nav.share === 'function') {
    try {
      let files: File[] | undefined
      if (imageUrl) {
        try {
          const blob = await (await fetch(imageUrl)).blob()
          const file = new File([blob], 'fachapp.jpg', { type: blob.type || 'image/jpeg' })
          if (nav.canShare?.({ files: [file] })) files = [file]
        } catch {
          /* sin imagen: se comparte solo el enlace */
        }
      }
      await nav.share(files ? { title, text: `${text}\n${url}`, files } : { title, text, url })
      return 'shared'
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'unsupported'
  }
}

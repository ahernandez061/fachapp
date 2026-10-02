import { isNative } from '@/lib/native'
import { authRedirectUrl } from '@/lib/supabase'

export type OAuthProvider = 'google' | 'apple' | 'x'

export const OAUTH_PROVIDERS: { id: OAuthProvider; label: string }[] = [
  { id: 'google', label: 'Google' },
  { id: 'apple', label: 'Apple' },
  { id: 'x', label: 'X' },
]

/** Opciones comunes de OAuth (login y vincular cuentas). */
export function oauthOptions(provider: OAuthProvider) {
  return {
    redirectTo: authRedirectUrl(),
    // En móvil abrimos el navegador del sistema (Google no permite OAuth en WebViews).
    skipBrowserRedirect: isNative(),
    // X: solo lo mínimo para identificarte; los permisos de lectura para misiones se
    // piden aparte, con su propio consentimiento. Apple: nombre y email.
    scopes:
      provider === 'x' ? 'users.read tweet.read' : provider === 'apple' ? 'name email' : undefined,
  }
}

/** En la app nativa, abre en el navegador del sistema la URL de OAuth devuelta. */
export async function openOAuthUrl(url: string | null | undefined) {
  if (isNative() && url) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url })
  }
}

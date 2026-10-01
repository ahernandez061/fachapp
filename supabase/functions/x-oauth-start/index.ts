// Inicia la conexión con X (OAuth 2.0 + PKCE). Requiere sesión y consentimiento RGPD previo.
// POST { redirect_to: string } → { url: string }
import { pkceChallenge, randomString } from '../_shared/crypto.ts'
import { adminClient, env, HttpError, isMock, json, requireUser, serve } from '../_shared/http.ts'
import { saveConnection } from '../_shared/x-account.ts'
import { authorizeUrl, mockXClient } from '../_shared/x-client.ts'

function safeRedirect(target: unknown) {
  const appUrl = env('APP_URL')
  if (typeof target !== 'string') return appUrl
  try {
    const u = new URL(target)
    const allowed =
      target.startsWith(appUrl) ||
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1' ||
      u.hostname.endsWith('.github.io')
    return allowed ? target : appUrl
  } catch {
    return appUrl
  }
}

serve(async (req) => {
  if (req.method !== 'POST') throw new HttpError(405, 'method', 'Método no permitido')
  const user = await requireUser(req)
  const body = await req.json().catch(() => ({}))
  const redirectTo = safeRedirect(body.redirect_to)
  const admin = adminClient()

  const { data: priv } = await admin
    .from('profile_private')
    .select('x_consent_at')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!priv?.x_consent_at) {
    throw new HttpError(403, 'consent_required', 'Debes aceptar el consentimiento para conectar X')
  }

  if (isMock()) {
    const { data: profile } = await admin
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    const me = await mockXClient(user.id, profile?.username ?? 'usuario').getMe()
    await saveConnection(admin, user.id, me, { access_token: `mock-token-${crypto.randomUUID()}` })
    return json({ url: redirectTo, mock: true })
  }

  const state = randomString(24)
  const verifier = randomString(48)
  const { error } = await admin
    .from('x_oauth_states')
    .insert({ state, user_id: user.id, code_verifier: verifier, redirect_to: redirectTo })
  if (error) throw error

  return json({
    url: authorizeUrl(state, await pkceChallenge(verifier), env('X_OAUTH_REDIRECT_URI')),
  })
})

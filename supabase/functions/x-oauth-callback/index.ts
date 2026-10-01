// Callback de X: intercambia el código por tokens, los cifra y vuelve a la app.
// GET ?code&state (lo llama X, sin JWT → verify_jwt = false en config.toml)
import { adminClient, env, serve } from '../_shared/http.ts'
import { saveConnection } from '../_shared/x-account.ts'
import { exchangeCode, realXClient } from '../_shared/x-client.ts'

function back(target: string, status: 'ok' | 'error' | 'denied') {
  const url = new URL(target)
  // La app usa HashRouter: el resultado va dentro del hash.
  url.hash = `/ajustes?x=${status}`
  return Response.redirect(url.toString(), 302)
}

serve(async (req) => {
  const url = new URL(req.url)
  const state = url.searchParams.get('state') ?? ''
  const code = url.searchParams.get('code')
  const appUrl = env('APP_URL')
  const admin = adminClient()

  const { data: row } = await admin
    .from('x_oauth_states')
    .select('*')
    .eq('state', state)
    .maybeSingle()
  if (!row) return back(appUrl, 'error')
  await admin.from('x_oauth_states').delete().eq('state', state)

  // Los estados caducan a los 10 minutos.
  if (Date.now() - new Date(row.created_at).getTime() > 10 * 60_000)
    return back(row.redirect_to ?? appUrl, 'error')
  if (!code || url.searchParams.get('error')) return back(row.redirect_to ?? appUrl, 'denied')

  try {
    const tokens = await exchangeCode(code, row.code_verifier, env('X_OAUTH_REDIRECT_URI'))
    const me = await realXClient(tokens.access_token).getMe()
    await saveConnection(admin, row.user_id, me, tokens)
    return back(row.redirect_to ?? appUrl, 'ok')
  } catch (e) {
    console.error('x-oauth-callback', e)
    return back(row.redirect_to ?? appUrl, 'error')
  }
})

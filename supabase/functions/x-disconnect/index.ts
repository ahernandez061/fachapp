// Desconecta X: revoca el token y borra los datos guardados. POST → { ok: true }
import { decrypt } from '../_shared/crypto.ts'
import { adminClient, isMock, json, requireUser, serve } from '../_shared/http.ts'
import { removeConnection } from '../_shared/x-account.ts'
import { revokeToken } from '../_shared/x-client.ts'

serve(async (req) => {
  const user = await requireUser(req)
  const admin = adminClient()
  const { data: acc } = await admin
    .from('x_accounts')
    .select('access_token_enc, x_user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (acc && !isMock() && !acc.x_user_id.startsWith('mock-')) {
    await revokeToken(await decrypt(acc.access_token_enc)).catch(() => undefined)
  }
  await removeConnection(admin, user.id)
  await admin.from('x_api_calls').delete().eq('user_id', user.id)
  await admin.from('profile_private').update({ x_consent_at: null }).eq('user_id', user.id)
  return json({ ok: true })
})

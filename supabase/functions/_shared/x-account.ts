import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { decrypt, encrypt } from './crypto.ts'
import { HttpError, isMock } from './http.ts'
import {
  mockXClient,
  realXClient,
  refreshTokens,
  X_SCOPES,
  type XClient,
  type XMe,
  type XTokens,
} from './x-client.ts'

/** Guarda la conexión (tokens cifrados) y marca el perfil como conectado. */
export async function saveConnection(
  admin: SupabaseClient,
  userId: string,
  me: XMe,
  tokens: XTokens,
) {
  const { error } = await admin.from('x_accounts').upsert({
    user_id: userId,
    x_user_id: me.id,
    x_username: me.username,
    access_token_enc: await encrypt(tokens.access_token),
    refresh_token_enc: tokens.refresh_token ? await encrypt(tokens.refresh_token) : null,
    expires_at: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null,
    scopes: tokens.scope ?? X_SCOPES.join(' '),
    connected_at: new Date().toISOString(),
  })
  if (error) throw error
  const { error: pErr } = await admin
    .from('profiles')
    .update({ x_connected: true, x_username: me.username })
    .eq('id', userId)
  if (pErr) throw pErr
}

export async function removeConnection(admin: SupabaseClient, userId: string) {
  await admin.from('x_accounts').delete().eq('user_id', userId)
  await admin.from('profiles').update({ x_connected: false, x_username: null }).eq('id', userId)
}

/** Devuelve un cliente de X listo para usar, refrescando el token si ha caducado. */
export async function getXClient(
  admin: SupabaseClient,
  userId: string,
): Promise<{ client: XClient; xUserId: string; username: string }> {
  const { data: acc, error } = await admin
    .from('x_accounts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!acc)
    throw new HttpError(400, 'x_not_connected', 'Conecta tu cuenta de X para verificar esta misión')

  if (isMock() || acc.x_user_id.startsWith('mock-')) {
    return {
      client: mockXClient(userId, acc.x_username),
      xUserId: acc.x_user_id,
      username: acc.x_username,
    }
  }

  let accessToken = await decrypt(acc.access_token_enc)
  const expired = acc.expires_at && new Date(acc.expires_at).getTime() < Date.now() + 60_000
  if (expired) {
    if (!acc.refresh_token_enc) {
      throw new HttpError(401, 'x_reconnect', 'Tu conexión con X ha caducado. Vuelve a conectarla.')
    }
    try {
      const tokens = await refreshTokens(await decrypt(acc.refresh_token_enc))
      accessToken = tokens.access_token
      await admin
        .from('x_accounts')
        .update({
          access_token_enc: await encrypt(tokens.access_token),
          refresh_token_enc: tokens.refresh_token
            ? await encrypt(tokens.refresh_token)
            : acc.refresh_token_enc,
          expires_at: tokens.expires_in
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : null,
        })
        .eq('user_id', userId)
    } catch (e) {
      console.error('refresh failed', e)
      throw new HttpError(401, 'x_reconnect', 'Tu conexión con X ha caducado. Vuelve a conectarla.')
    }
  }
  return { client: realXClient(accessToken), xUserId: acc.x_user_id, username: acc.x_username }
}

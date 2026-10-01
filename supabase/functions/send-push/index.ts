// Envía una notificación push a los dispositivos del usuario.
// La llama un trigger de BD (pg_net) al insertar en `notifications`, con la service_role key.
// POST { notification_id } → { sent, removed, mock? }
import { adminClient, env, HttpError, json, serve } from '../_shared/http.ts'
import { parseServiceAccount, sendFcm } from '../_shared/fcm.ts'
import { pushMessage } from '../_shared/push.ts'

serve(async (req) => {
  if (req.method !== 'POST') throw new HttpError(405, 'method', 'Método no permitido')
  // Solo el servidor (trigger de BD) puede llamar a esta función.
  const auth = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  if (auth !== env('SUPABASE_SERVICE_ROLE_KEY')) {
    throw new HttpError(401, 'unauthorized', 'Solo para uso interno')
  }

  const { notification_id } = await req.json().catch(() => ({}))
  if (typeof notification_id !== 'string')
    throw new HttpError(400, 'bad_request', 'Falta notification_id')

  const admin = adminClient()
  const { data: n } = await admin
    .from('notifications')
    .select('*')
    .eq('id', notification_id)
    .maybeSingle()
  if (!n) throw new HttpError(404, 'not_found', 'Notificación no encontrada')

  const { data: tokens } = await admin.from('push_tokens').select('token').eq('user_id', n.user_id)
  if (!tokens?.length) return json({ sent: 0, removed: 0 })

  const msg = pushMessage(n)
  const sa = parseServiceAccount(Deno.env.get('FCM_SERVICE_ACCOUNT'))
  if (!sa) {
    // Sin Firebase configurado (desarrollo): solo se registra en el log.
    console.log(`[push mock] ${tokens.length} dispositivo(s) · ${msg.title} · ${msg.body}`)
    return json({ sent: 0, removed: 0, mock: true, message: msg })
  }

  let sent = 0
  const invalid: string[] = []
  for (const { token } of tokens) {
    const r = await sendFcm(sa, token, msg)
    if (r === 'ok') sent++
    if (r === 'invalid_token') invalid.push(token)
  }
  if (invalid.length) await admin.from('push_tokens').delete().in('token', invalid)
  return json({ sent, removed: invalid.length })
})

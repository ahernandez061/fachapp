// Verifica una misión x_auto leyendo los datos de X del usuario.
// POST { mission_id } → { status, result, cached }
import { adminClient, HttpError, isMock, json, requireUser, serve } from '../_shared/http.ts'
import {
  evaluateRule,
  parseRule,
  RuleError,
  ruleNeeds,
  windowStart,
  type XUserData,
} from '../_shared/rules.ts'
import { getXClient } from '../_shared/x-account.ts'
import { XApiError } from '../_shared/x-client.ts'

const CACHE_MINUTES = 15
const DAILY_LIMIT = Number(Deno.env.get('X_DAILY_LIMIT') ?? '10')

serve(async (req) => {
  if (req.method !== 'POST') throw new HttpError(405, 'method', 'Método no permitido')
  const user = await requireUser(req)
  const { mission_id } = await req.json().catch(() => ({}))
  if (typeof mission_id !== 'string') throw new HttpError(400, 'bad_request', 'Falta mission_id')

  const admin = adminClient()
  const { data: mission } = await admin
    .from('missions')
    .select('*')
    .eq('id', mission_id)
    .maybeSingle()
  if (!mission || !mission.active) throw new HttpError(404, 'not_found', 'La misión no existe')
  if (mission.verification_type !== 'x_auto') {
    throw new HttpError(400, 'not_x', 'Esta misión no se verifica con X')
  }
  const now = new Date()
  if (
    (mission.starts_at && now < new Date(mission.starts_at)) ||
    (mission.ends_at && now > new Date(mission.ends_at))
  ) {
    throw new HttpError(400, 'out_of_dates', 'La misión no está disponible en estas fechas')
  }

  const { data: existing } = await admin
    .from('mission_attempts')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('mission_id', mission_id)
    .maybeSingle()
  if (existing?.status === 'verified') {
    return json({ status: 'verified', already: true })
  }

  let rule
  try {
    rule = parseRule(mission.rules)
  } catch (e) {
    if (e instanceof RuleError)
      throw new HttpError(500, 'bad_rule', `Regla mal configurada: ${e.message}`)
    throw e
  }

  const needs = ruleNeeds(rule)
  const cacheKey = `${needs.tweets ? 'tweets' : 'me'}:${needs.windowDays}`
  const since = new Date(now.getTime() - CACHE_MINUTES * 60_000).toISOString()

  // 1) Caché: reutiliza la respuesta de X de los últimos 15 minutos.
  const { data: cachedCall } = await admin
    .from('x_api_calls')
    .select('response')
    .eq('user_id', user.id)
    .eq('cache_key', cacheKey)
    .gte('created_at', since)
    .not('response', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let data: XUserData
  let cached = false
  if (cachedCall?.response) {
    data = cachedCall.response as XUserData
    cached = true
  } else {
    // 2) Límite diario de llamadas reales por usuario (la API de X cobra por uso).
    const { count } = await admin
      .from('x_api_calls')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', new Date(now.getTime() - 24 * 3600_000).toISOString())
    if ((count ?? 0) >= DAILY_LIMIT) {
      throw new HttpError(
        429,
        'rate_limited',
        `Has alcanzado el límite de ${DAILY_LIMIT} verificaciones al día. Vuelve mañana.`,
      )
    }

    const { client, xUserId } = await getXClient(admin, user.id)
    try {
      const me = await client.getMe()
      const tweets = needs.tweets
        ? await client.getRecentTweets(xUserId, windowStart(needs.windowDays, now))
        : []
      data = { followers_count: me.followers_count, tweets }
    } catch (e) {
      if (e instanceof XApiError && e.status === 429) {
        throw new HttpError(
          429,
          'x_rate_limited',
          'X está limitando las consultas. Prueba en unos minutos.',
        )
      }
      if (e instanceof XApiError && e.status === 401) {
        throw new HttpError(
          401,
          'x_reconnect',
          'Tu conexión con X ha caducado. Vuelve a conectarla.',
        )
      }
      throw e
    }
    await admin
      .from('x_api_calls')
      .insert({ user_id: user.id, cache_key: cacheKey, response: data })
  }

  const result = evaluateRule(rule, data, now)
  const status = result.passed ? 'verified' : 'rejected'
  const evidence = {
    rule,
    current: result.current,
    target: result.target,
    detail: result.detail,
    checked_at: now.toISOString(),
    mock: isMock(),
  }

  const { error } = await admin.from('mission_attempts').upsert(
    {
      user_id: user.id,
      mission_id,
      status,
      evidence,
      verified_at: result.passed ? now.toISOString() : null,
    },
    { onConflict: 'user_id,mission_id' },
  )
  if (error) throw error

  return json({ status, result, cached })
})

// Evaluador de reglas de misiones `x_auto`.
// TypeScript puro (sin APIs de Deno ni del navegador): lo usan las Edge Functions
// y el frontend (para describir y validar reglas en el panel de admin).

export type PostWithHashtagRule = {
  type: 'post_with_hashtag'
  hashtag: string
  min_count?: number
  window_days?: number
}
export type FollowersMinRule = { type: 'followers_min'; value: number }
export type PostCountRule = { type: 'post_count'; min: number; window_days?: number }

export type XRule = PostWithHashtagRule | FollowersMinRule | PostCountRule
export type XRuleType = XRule['type']

export type XTweet = {
  id: string
  text: string
  created_at: string
  /** Hashtags de `entities.hashtags` (sin #), si la API los devuelve. */
  hashtags?: string[]
}

export type XUserData = {
  followers_count: number
  /** Posts del usuario dentro de la ventana pedida (o más recientes). */
  tweets: XTweet[]
}

export type RuleResult = {
  passed: boolean
  current: number
  target: number
  detail: string
}

export class RuleError extends Error {}

export const RULE_TYPES: Record<XRuleType, string> = {
  post_with_hashtag: 'Publicar con un hashtag',
  followers_min: 'Mínimo de seguidores',
  post_count: 'Número de publicaciones',
}

export const DEFAULT_WINDOW_DAYS = 7
export const MAX_WINDOW_DAYS = 30

const isPositiveInt = (v: unknown, max = 1_000_000): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= max

function checkWindow(v: unknown) {
  if (v === undefined) return
  if (!isPositiveInt(v, MAX_WINDOW_DAYS)) {
    throw new RuleError(`window_days debe ser un entero entre 1 y ${MAX_WINDOW_DAYS}`)
  }
}

export function normalizeHashtag(tag: string) {
  return tag.trim().replace(/^#+/, '').toLowerCase()
}

/** Valida un objeto JSON y lo convierte en una regla tipada. Lanza RuleError si no es válido. */
export function parseRule(raw: unknown): XRule {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new RuleError('La regla debe ser un objeto JSON')
  }
  const r = raw as Record<string, unknown>
  switch (r.type) {
    case 'post_with_hashtag': {
      if (typeof r.hashtag !== 'string' || !/^#?[\p{L}\p{N}_]{1,100}$/u.test(r.hashtag.trim())) {
        throw new RuleError('hashtag debe ser un hashtag válido, p. ej. "#FachApp"')
      }
      if (r.min_count !== undefined && !isPositiveInt(r.min_count, 100)) {
        throw new RuleError('min_count debe ser un entero entre 1 y 100')
      }
      checkWindow(r.window_days)
      return {
        type: 'post_with_hashtag',
        hashtag: r.hashtag.trim(),
        min_count: (r.min_count as number | undefined) ?? 1,
        window_days: (r.window_days as number | undefined) ?? DEFAULT_WINDOW_DAYS,
      }
    }
    case 'followers_min': {
      if (!isPositiveInt(r.value, 100_000_000)) {
        throw new RuleError('value debe ser un entero positivo')
      }
      return { type: 'followers_min', value: r.value }
    }
    case 'post_count': {
      if (!isPositiveInt(r.min, 1000)) throw new RuleError('min debe ser un entero entre 1 y 1000')
      checkWindow(r.window_days)
      return {
        type: 'post_count',
        min: r.min,
        window_days: (r.window_days as number | undefined) ?? DEFAULT_WINDOW_DAYS,
      }
    }
    default:
      throw new RuleError(
        `Tipo de regla desconocido: ${String(r.type)}. Usa: ${Object.keys(RULE_TYPES).join(', ')}`,
      )
  }
}

/** ¿Qué datos de X necesita esta regla? Sirve para no pedir a la API más de lo necesario. */
export function ruleNeeds(rule: XRule): { tweets: boolean; windowDays: number } {
  switch (rule.type) {
    case 'followers_min':
      return { tweets: false, windowDays: 0 }
    case 'post_with_hashtag':
    case 'post_count':
      return { tweets: true, windowDays: rule.window_days ?? DEFAULT_WINDOW_DAYS }
  }
}

export function windowStart(days: number, now: Date) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}

function tweetsInWindow(tweets: XTweet[], days: number, now: Date) {
  const from = windowStart(days, now).getTime()
  const to = now.getTime()
  return tweets.filter((t) => {
    const ts = new Date(t.created_at).getTime()
    return ts >= from && ts <= to
  })
}

export function tweetHasHashtag(tweet: XTweet, hashtag: string) {
  const wanted = normalizeHashtag(hashtag)
  if (tweet.hashtags?.some((h) => normalizeHashtag(h) === wanted)) return true
  const escaped = wanted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^\\p{L}\\p{N}_])#${escaped}(?![\\p{L}\\p{N}_])`, 'iu').test(tweet.text)
}

/** Evalúa la regla contra los datos de X del usuario. Función pura. */
export function evaluateRule(rule: XRule, data: XUserData, now: Date = new Date()): RuleResult {
  switch (rule.type) {
    case 'followers_min': {
      const current = data.followers_count
      return {
        passed: current >= rule.value,
        current,
        target: rule.value,
        detail: `Tienes ${current} de ${rule.value} seguidores`,
      }
    }
    case 'post_with_hashtag': {
      const days = rule.window_days ?? DEFAULT_WINDOW_DAYS
      const target = rule.min_count ?? 1
      const current = tweetsInWindow(data.tweets, days, now).filter((t) =>
        tweetHasHashtag(t, rule.hashtag),
      ).length
      return {
        passed: current >= target,
        current,
        target,
        detail: `${current} de ${target} posts con #${normalizeHashtag(rule.hashtag)} en los últimos ${days} días`,
      }
    }
    case 'post_count': {
      const days = rule.window_days ?? DEFAULT_WINDOW_DAYS
      const current = tweetsInWindow(data.tweets, days, now).length
      return {
        passed: current >= rule.min,
        current,
        target: rule.min,
        detail: `${current} de ${rule.min} posts en los últimos ${days} días`,
      }
    }
  }
}

/** Descripción en lenguaje natural para mostrar al usuario. */
export function describeRule(rule: XRule): string {
  switch (rule.type) {
    case 'followers_min':
      return `Tener al menos ${rule.value} seguidores en X.`
    case 'post_with_hashtag': {
      const n = rule.min_count ?? 1
      const days = rule.window_days ?? DEFAULT_WINDOW_DAYS
      return `Publicar ${n === 1 ? 'un post' : `${n} posts`} en X con #${normalizeHashtag(rule.hashtag)} en los últimos ${days} días.`
    }
    case 'post_count': {
      const days = rule.window_days ?? DEFAULT_WINDOW_DAYS
      return `Publicar al menos ${rule.min} posts en X en los últimos ${days} días.`
    }
  }
}

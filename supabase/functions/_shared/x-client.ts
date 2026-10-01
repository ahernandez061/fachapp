// Cliente mínimo de la X API v2 (solo lectura) + versión mock para desarrollo.
import type { XTweet } from './rules.ts'

export const X_SCOPES = ['tweet.read', 'users.read', 'offline.access']
const API = 'https://api.x.com/2'

export type XMe = { id: string; username: string; name: string; followers_count: number }

export type XTokens = {
  access_token: string
  refresh_token?: string
  expires_in?: number
  scope?: string
}

export interface XClient {
  getMe(): Promise<XMe>
  getRecentTweets(userId: string, since: Date): Promise<XTweet[]>
}

export class XApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function xFetch(url: string, init: RequestInit) {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.text()
    throw new XApiError(res.status, `X API ${res.status}: ${body.slice(0, 300)}`)
  }
  return res.json()
}

export function realXClient(accessToken: string): XClient {
  const headers = { Authorization: `Bearer ${accessToken}` }
  return {
    async getMe() {
      const data = await xFetch(`${API}/users/me?user.fields=public_metrics`, { headers })
      return {
        id: data.data.id,
        username: data.data.username,
        name: data.data.name,
        followers_count: data.data.public_metrics?.followers_count ?? 0,
      }
    },
    async getRecentTweets(userId, since) {
      const tweets: XTweet[] = []
      let token: string | undefined
      // Máx. 2 páginas de 100 para acotar el coste por verificación.
      for (let page = 0; page < 2; page++) {
        const params = new URLSearchParams({
          max_results: '100',
          start_time: since.toISOString(),
          'tweet.fields': 'created_at,entities',
          exclude: 'retweets',
        })
        if (token) params.set('pagination_token', token)
        const data = await xFetch(`${API}/users/${userId}/tweets?${params}`, { headers })
        for (const t of data.data ?? []) {
          tweets.push({
            id: t.id,
            text: t.text,
            created_at: t.created_at,
            hashtags: (t.entities?.hashtags ?? []).map((h: { tag: string }) => h.tag),
          })
        }
        token = data.meta?.next_token
        if (!token) break
      }
      return tweets
    },
  }
}

function basicAuth() {
  const id = Deno.env.get('X_CLIENT_ID') ?? ''
  const secret = Deno.env.get('X_CLIENT_SECRET') ?? ''
  return `Basic ${btoa(`${id}:${secret}`)}`
}

async function tokenRequest(params: Record<string, string>): Promise<XTokens> {
  return xFetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: basicAuth() },
    body: new URLSearchParams({ client_id: Deno.env.get('X_CLIENT_ID') ?? '', ...params }),
  })
}

export function exchangeCode(code: string, verifier: string, redirectUri: string) {
  return tokenRequest({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  })
}

export function refreshTokens(refreshToken: string) {
  return tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken })
}

export async function revokeToken(token: string) {
  await fetch(`${API}/oauth2/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: basicAuth() },
    body: new URLSearchParams({ token, token_type_hint: 'access_token' }),
  }).catch(() => undefined)
}

export function authorizeUrl(state: string, challenge: string, redirectUri: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: Deno.env.get('X_CLIENT_ID') ?? '',
    redirect_uri: redirectUri,
    scope: X_SCOPES.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  return `https://x.com/i/oauth2/authorize?${params}`
}

// ---------------------------------------------------------------------------
// Mock: datos falsos deterministas por usuario (no gasta créditos de la API).
// ---------------------------------------------------------------------------
function hash(s: string) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

export function mockXClient(userId: string, username = 'usuario_mock'): XClient {
  const seed = hash(userId)
  return {
    async getMe() {
      return {
        id: `mock-${seed}`,
        username,
        name: username,
        followers_count: 40 + (seed % 200),
      }
    },
    async getRecentTweets(_userId, since) {
      const now = Date.now()
      const count = 3 + (seed % 6)
      const tweets: XTweet[] = []
      for (let i = 0; i < count; i++) {
        const created = new Date(now - (i * 26 + (seed % 12)) * 3600_000)
        if (created < since) continue
        const withTag = i % 2 === 0
        tweets.push({
          id: `mock-${seed}-${i}`,
          text: withTag
            ? `Misión del día completada #FachApp #España #12deOctubre (${i})`
            : `Post de prueba ${i}`,
          created_at: created.toISOString(),
          hashtags: withTag ? ['FachApp', 'España', '12deOctubre'] : [],
        })
      }
      return tweets
    },
  }
}

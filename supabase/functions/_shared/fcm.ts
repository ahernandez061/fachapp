// Envío por Firebase Cloud Messaging (API HTTP v1) con una cuenta de servicio.
// Secreto FCM_SERVICE_ACCOUNT = JSON de la cuenta de servicio de Firebase.
import type { PushMessage } from './push.ts'

type ServiceAccount = { project_id: string; client_email: string; private_key: string }

const b64url = (data: Uint8Array | string) => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function pemToDer(pem: string) {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
}

let cached: { token: string; exp: number } | null = null

/** Token OAuth 2.0 de Google firmando un JWT RS256 con la clave de la cuenta de servicio. */
async function accessToken(sa: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000)
  if (cached && cached.exp - 60 > now) return cached.token
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = new Uint8Array(
    await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      new TextEncoder().encode(`${header}.${claims}`),
    ),
  )
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${b64url(sig)}`,
    }),
  })
  if (!res.ok) throw new Error(`Google OAuth ${res.status}: ${await res.text()}`)
  const data = await res.json()
  cached = { token: data.access_token, exp: now + data.expires_in }
  return cached.token
}

export type FcmResult = 'ok' | 'invalid_token' | 'error'

export async function sendFcm(
  sa: ServiceAccount,
  token: string,
  msg: PushMessage,
): Promise<FcmResult> {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await accessToken(sa)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: msg.title, body: msg.body },
        data: { link: msg.link },
        android: { priority: 'high', notification: { color: '#c2410c' } },
        apns: { payload: { aps: { sound: 'default' } } },
      },
    }),
  })
  if (res.ok) return 'ok'
  const text = await res.text()
  // Token caducado o app desinstalada: hay que borrarlo.
  if (res.status === 404 || text.includes('UNREGISTERED') || text.includes('INVALID_ARGUMENT')) {
    return 'invalid_token'
  }
  console.error('FCM', res.status, text.slice(0, 300))
  return 'error'
}

export function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw) return null
  try {
    const sa = JSON.parse(raw)
    return sa.project_id && sa.client_email && sa.private_key ? sa : null
  } catch {
    return null
  }
}

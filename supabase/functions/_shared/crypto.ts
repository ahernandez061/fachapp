// Cifrado AES-256-GCM de los tokens de X antes de guardarlos en la BD.
// Clave: secreto X_TOKEN_ENCRYPTION_KEY (32 bytes en base64).

const enc = new TextEncoder()
const dec = new TextDecoder()

const b64 = {
  encode: (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)),
  decode: (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)),
}

let keyPromise: Promise<CryptoKey> | null = null

function getKey() {
  if (!keyPromise) {
    const raw = Deno.env.get('X_TOKEN_ENCRYPTION_KEY')
    if (!raw) throw new Error('Falta X_TOKEN_ENCRYPTION_KEY')
    const bytes = b64.decode(raw)
    if (bytes.length !== 32) throw new Error('X_TOKEN_ENCRYPTION_KEY debe tener 32 bytes')
    keyPromise = crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt'])
  }
  return keyPromise
}

export async function encrypt(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await getKey(), enc.encode(plain)),
  )
  const out = new Uint8Array(iv.length + cipher.length)
  out.set(iv)
  out.set(cipher, iv.length)
  return b64.encode(out)
}

export async function decrypt(payload: string) {
  const bytes = b64.decode(payload)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes.slice(0, 12) },
    await getKey(),
    bytes.slice(12),
  )
  return dec.decode(plain)
}

export function randomString(bytes = 32) {
  const arr = crypto.getRandomValues(new Uint8Array(bytes))
  return b64.encode(arr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function pkceChallenge(verifier: string) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(verifier)))
  return b64.encode(digest).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

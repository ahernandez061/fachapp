import imageCompression from 'browser-image-compression'
import { supabase } from './supabase'

export type Bucket = 'avatars' | 'proofs' | 'posts' | 'covers'
const PUBLIC_BUCKETS: Bucket[] = ['avatars', 'posts', 'covers']

/** Comprime y convierte a WebP en el navegador antes de subir. */
export async function compressToWebp(file: Blob, maxSize = 1600): Promise<File> {
  const input =
    file instanceof File ? file : new File([file], 'imagen', { type: file.type || 'image/jpeg' })
  const out = await imageCompression(input, {
    maxSizeMB: 1,
    maxWidthOrHeight: maxSize,
    fileType: 'image/webp',
    initialQuality: 0.82,
    useWebWorker: true,
  })
  return new File([out], 'imagen.webp', { type: 'image/webp' })
}

/**
 * Sube una imagen a `bucket/<uid>/<uuid>.webp` y devuelve la ruta con el bucket
 * como prefijo (p. ej. "proofs/uid/abc.webp"), que es lo que se guarda en la BD.
 */
export async function uploadImage(bucket: Bucket, userId: string, file: Blob, maxSize?: number) {
  const webp = await compressToWebp(file, maxSize)
  const path = `${userId}/${crypto.randomUUID()}.webp`
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, webp, { contentType: 'image/webp', upsert: false })
  if (error) throw error
  return `${bucket}/${path}`
}

export function splitStoragePath(fullPath: string) {
  const [bucket, ...rest] = fullPath.split('/')
  return { bucket: bucket as Bucket, path: rest.join('/') }
}

export function isExternalUrl(path: string) {
  return /^https?:\/\//.test(path)
}

/** URL directa para buckets públicos o URLs externas; null si hace falta URL firmada. */
export function directImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (isExternalUrl(path) || path.startsWith('blob:') || path.startsWith('data:')) return path
  const { bucket, path: inner } = splitStoragePath(path)
  if (PUBLIC_BUCKETS.includes(bucket)) {
    return supabase.storage.from(bucket).getPublicUrl(inner).data.publicUrl
  }
  return null
}

export async function signedImageUrl(path: string) {
  const { bucket, path: inner } = splitStoragePath(path)
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(inner, 60 * 60)
  if (error) throw error
  return data.signedUrl
}

/** Borra todos los ficheros del usuario (antes de eliminar la cuenta). */
export async function deleteAllUserFiles(userId: string) {
  for (const bucket of ['avatars', 'proofs', 'posts'] as Bucket[]) {
    const { data } = await supabase.storage.from(bucket).list(userId, { limit: 1000 })
    if (data?.length) {
      await supabase.storage.from(bucket).remove(data.map((f) => `${userId}/${f.name}`))
    }
  }
}

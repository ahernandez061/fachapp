import { FunctionsHttpError } from '@supabase/supabase-js'

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email o contraseña incorrectos.',
  user_already_exists: 'Ya existe una cuenta con ese email.',
  email_exists: 'Ya existe una cuenta con ese email.',
  weak_password: 'La contraseña es demasiado débil (mínimo 8 caracteres).',
  email_not_confirmed: 'Confirma tu email antes de entrar (revisa tu bandeja de entrada).',
  over_email_send_rate_limit: 'Has pedido demasiados emails. Espera unos minutos.',
  over_request_rate_limit: 'Demasiados intentos. Espera unos minutos.',
  same_password: 'La nueva contraseña debe ser distinta de la anterior.',
  validation_failed: 'Revisa los datos introducidos.',
  provider_disabled: 'Este método de acceso no está activado todavía.',
  session_not_found: 'Tu sesión ha caducado. Vuelve a entrar.',
}

const PG_MESSAGES: Record<string, string> = {
  '23505': 'Eso ya existe.',
  '23514': 'Algún dato no cumple el formato permitido.',
  '42501': 'No tienes permiso para hacer eso.',
  PGRST116: 'No encontrado.',
}

type MaybeError = { message?: string; code?: string; status?: number; hint?: string }

/** Convierte cualquier error de Supabase/red en un mensaje amable en español. */
export function errorMessage(e: unknown): string {
  if (!e) return 'Ha ocurrido un error inesperado.'
  if (typeof e === 'string') return e
  const err = e as MaybeError
  if (err.code && AUTH_MESSAGES[err.code]) return AUTH_MESSAGES[err.code]
  if (err.message === 'Failed to fetch' || err.message?.includes('NetworkError')) {
    return 'No hay conexión con el servidor. Revisa tu conexión a internet.'
  }
  // Los RPC de FachApp lanzan mensajes ya en español.
  if (
    err.message &&
    /[áéíóúñ¿¡]|Debes|No puedes|Ya |La misión|Esta misión|El texto/.test(err.message)
  ) {
    return err.message
  }
  if (err.code && PG_MESSAGES[err.code]) return PG_MESSAGES[err.code]
  return err.message || 'Ha ocurrido un error inesperado.'
}

/** Extrae `{ error, message }` del cuerpo de una Edge Function que ha fallado. */
export async function functionError(e: unknown): Promise<{ code: string; message: string }> {
  if (e instanceof FunctionsHttpError) {
    try {
      const body = await e.context.json()
      return { code: body.error ?? 'error', message: body.message ?? errorMessage(e) }
    } catch {
      /* cuerpo no JSON */
    }
  }
  return { code: 'error', message: errorMessage(e) }
}

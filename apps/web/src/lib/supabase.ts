import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { env, isSupabaseConfigured } from './env'
import { isNative } from './native'

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn('[FachApp] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Revisa .env.local')
}

export const supabase = createClient<Database>(
  env.supabaseUrl ?? 'http://localhost:54321',
  env.supabaseAnonKey ?? 'public-anon-key-placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  },
)

/** En la app nativa (Capacitor) los logins vuelven por deep link. */
export const NATIVE_AUTH_REDIRECT = 'es.fachapp.app://auth'

/** URL de vuelta para login/OAuth/emails: web o deep link nativo. */
export function authRedirectUrl() {
  return isNative() ? NATIVE_AUTH_REDIRECT : appRedirectUrl()
}

/** URL a la que vuelven los flujos de OAuth y emails (raíz de la app, sin hash). */
export function appRedirectUrl(query = '') {
  return `${window.location.origin}${import.meta.env.BASE_URL}${query}`
}

import { createClient } from '@supabase/supabase-js'
import { env, isSupabaseConfigured } from './env'

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn('[FachApp] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Revisa .env.local')
}

// En la Fase 1 se tipará con `Database` generado por `supabase gen types`.
export const supabase = createClient(
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

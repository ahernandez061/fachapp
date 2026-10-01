// Variables de entorno públicas (VITE_*). Nunca pongas aquí secretos.
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  xMock: import.meta.env.VITE_X_MOCK === 'true',
  // Botones de acceso rápido con las cuentas demo del seed. SOLO para desarrollo local:
  // el build de producción (deploy.yml) no define esta variable.
  demoAccounts: import.meta.env.VITE_DEMO_ACCOUNTS === 'true',
}

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey)

/** Cuentas creadas por supabase/seed.sql (solo existen en local). */
export const DEMO_ACCOUNTS = [
  { role: 'usuario', label: 'Entrar como usuario', email: 'usuario@fachapp.local' },
  { role: 'admin', label: 'Entrar como admin', email: 'admin@fachapp.local' },
] as const
export const DEMO_PASSWORD = 'fachapp123'

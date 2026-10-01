import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

export function env(name: string, fallback?: string) {
  const v = Deno.env.get(name) ?? fallback
  if (v === undefined) throw new HttpError(500, 'config', `Falta la variable ${name}`)
  return v
}

export const isMock = () => (Deno.env.get('X_MOCK') ?? 'false') === 'true'

/** Cliente con service_role: salta RLS. Úsalo solo en el servidor. */
export function adminClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Usuario autenticado a partir del JWT de la cabecera Authorization. */
export async function requireUser(req: Request): Promise<User> {
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) throw new HttpError(401, 'unauthorized', 'Debes iniciar sesión')
  const { data, error } = await adminClient().auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'unauthorized', 'Sesión no válida')
  return data.user
}

/** Envuelve un handler con CORS y gestión de errores uniforme. */
export function serve(handler: (req: Request) => Promise<Response>) {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    try {
      return await handler(req)
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.code, message: e.message }, e.status)
      console.error(e)
      return json({ error: 'internal', message: 'Error inesperado. Inténtalo más tarde.' }, 500)
    }
  })
}

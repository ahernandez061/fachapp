-- Fase 3 — Integración con X. Estas tablas SOLO son accesibles desde Edge Functions
-- (service_role): RLS activado sin políticas + sin privilegios para anon/authenticated.

create table public.x_accounts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  x_user_id text not null,
  x_username text not null,
  access_token_enc text not null,   -- AES-GCM, clave en el secreto X_TOKEN_ENCRYPTION_KEY
  refresh_token_enc text,
  expires_at timestamptz,
  scopes text not null default '',
  connected_at timestamptz not null default now()
);

create table public.x_oauth_states (
  state text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  code_verifier text not null,
  redirect_to text,
  created_at timestamptz not null default now()
);

-- Registro de llamadas a la API de X: sirve de límite por usuario y de caché.
create table public.x_api_calls (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  cache_key text not null,
  response jsonb,
  created_at timestamptz not null default now()
);
create index x_api_calls_user_idx on public.x_api_calls (user_id, created_at desc);
create index x_api_calls_cache_idx on public.x_api_calls (user_id, cache_key, created_at desc);

alter table public.x_accounts enable row level security;
alter table public.x_oauth_states enable row level security;
alter table public.x_api_calls enable row level security;

revoke all on public.x_accounts, public.x_oauth_states, public.x_api_calls from anon, authenticated;

-- Consentimiento RGPD explícito antes de conectar X.
create or replace function public.give_x_consent()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.profile_private set x_consent_at = now() where user_id = auth.uid();
$$;

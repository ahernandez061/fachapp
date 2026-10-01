-- Fase 7 — Tokens de notificaciones push de la app móvil (FCM / APNs)
create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('android', 'ios')),
  created_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;
create policy "mis tokens" on public.push_tokens for select to authenticated using (user_id = auth.uid());
create policy "registrar token" on public.push_tokens for insert to authenticated with check (user_id = auth.uid());
create policy "actualizar token" on public.push_tokens for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "borrar token" on public.push_tokens for delete to authenticated using (user_id = auth.uid());

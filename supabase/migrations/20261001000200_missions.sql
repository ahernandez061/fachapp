-- Fase 2 — Misiones (sin X)
create type public.verification_type as enum ('x_auto', 'photo', 'manual');
create type public.attempt_status as enum ('pending', 'verified', 'rejected');
create type public.mission_difficulty as enum ('facil', 'media', 'dificil');

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 1000),
  category text not null default 'general',
  difficulty public.mission_difficulty not null default 'facil',
  points integer not null check (points between 1 and 10000),
  verification_type public.verification_type not null,
  rules jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean not null default true,
  cover_image text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  -- Las misiones automáticas deben declarar el tipo de regla.
  check (verification_type <> 'x_auto' or rules ? 'type')
);

create index missions_active_idx on public.missions (active, created_at desc);

create table public.mission_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mission_id uuid not null references public.missions (id) on delete cascade,
  status public.attempt_status not null default 'pending',
  evidence jsonb not null default '{}'::jsonb,
  photo_url text,
  note text check (char_length(note) <= 500),
  review_note text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz,
  unique (user_id, mission_id)
);

create index mission_attempts_status_idx on public.mission_attempts (status, created_at);
create index mission_attempts_user_idx on public.mission_attempts (user_id, status);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger mission_attempts_touch
  before update on public.mission_attempts
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RPC: enviar prueba con foto (o petición manual). Queda pendiente de revisión.
-- ---------------------------------------------------------------------------
create or replace function public.submit_attempt(p_mission_id uuid, p_photo_path text, p_note text)
returns public.mission_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.missions;
  result public.mission_attempts;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;

  select * into m from public.missions where id = p_mission_id;
  if not found or not m.active then
    raise exception 'La misión no existe o no está activa' using errcode = 'P0002';
  end if;
  if (m.starts_at is not null and now() < m.starts_at) or (m.ends_at is not null and now() > m.ends_at) then
    raise exception 'La misión no está disponible en estas fechas' using errcode = '22023';
  end if;
  if m.verification_type = 'x_auto' then
    raise exception 'Esta misión se verifica automáticamente con X' using errcode = '22023';
  end if;
  if m.verification_type = 'photo' and coalesce(p_photo_path, '') = '' then
    raise exception 'Esta misión necesita una foto como prueba' using errcode = '22023';
  end if;
  if p_photo_path is not null and split_part(p_photo_path, '/', 2) <> auth.uid()::text then
    raise exception 'Ruta de foto no válida' using errcode = '42501';
  end if;

  insert into public.mission_attempts (user_id, mission_id, status, photo_url, note)
  values (auth.uid(), p_mission_id, 'pending', p_photo_path, nullif(trim(p_note), ''))
  on conflict (user_id, mission_id) do update
    set status = 'pending', photo_url = excluded.photo_url, note = excluded.note,
        review_note = null, reviewed_by = null
    where public.mission_attempts.status <> 'verified'
  returning * into result;

  if result.id is null then
    raise exception 'Ya completaste esta misión' using errcode = '23505';
  end if;
  return result;
end;
$$;

-- RPC: un admin valida o rechaza una prueba.
create or replace function public.review_attempt(p_attempt_id uuid, p_approve boolean, p_note text default null)
returns public.mission_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.mission_attempts;
begin
  if not public.is_admin() then
    raise exception 'Solo los administradores pueden validar pruebas' using errcode = '42501';
  end if;
  update public.mission_attempts
     set status = case when p_approve then 'verified' else 'rejected' end::public.attempt_status,
         verified_at = case when p_approve then now() else null end,
         review_note = nullif(trim(p_note), ''),
         reviewed_by = auth.uid()
   where id = p_attempt_id and status = 'pending'
  returning * into result;
  if result.id is null then
    raise exception 'La prueba no existe o ya fue revisada' using errcode = 'P0002';
  end if;
  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.missions enable row level security;
alter table public.mission_attempts enable row level security;

create policy "misiones activas visibles" on public.missions
  for select using (active or public.is_admin());
create policy "admins crean misiones" on public.missions
  for insert to authenticated with check (public.is_admin());
create policy "admins editan misiones" on public.missions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins borran misiones" on public.missions
  for delete to authenticated using (public.is_admin());

-- Las misiones completadas son públicas (perfil, ranking); el resto solo las ve su dueño y los admins.
create policy "intentos visibles" on public.mission_attempts
  for select using (status = 'verified' or user_id = auth.uid() or public.is_admin());
-- Sin políticas de insert/update: solo vía RPC (security definer) o Edge Functions (service_role).

-- ---------------------------------------------------------------------------
-- Storage: pruebas (privado) y portadas de misiones (público)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('proofs', 'proofs', false, 5242880, array['image/webp', 'image/jpeg', 'image/png']),
  ('covers', 'covers', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "pruebas: subir en mi carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "pruebas: borrar las mías" on storage.objects
  for delete to authenticated
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
-- Se pueden ver: el dueño, los admins y cualquiera si la prueba ya está verificada.
create policy "pruebas: leer" on storage.objects
  for select using (
    bucket_id = 'proofs' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
      or exists (
        select 1 from public.mission_attempts a
        where a.photo_url = 'proofs/' || name and a.status = 'verified'
      )
    )
  );

create policy "portadas: leer" on storage.objects for select using (bucket_id = 'covers');
create policy "portadas: admins suben" on storage.objects
  for insert to authenticated with check (bucket_id = 'covers' and public.is_admin());
create policy "portadas: admins borran" on storage.objects
  for delete to authenticated using (bucket_id = 'covers' and public.is_admin());

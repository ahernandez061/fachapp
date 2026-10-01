-- Fase 1 — Auth y perfiles
create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Provincias (52 + Ceuta y Melilla) con su comunidad autónoma
-- ---------------------------------------------------------------------------
create table public.provincias (
  code text primary key,
  name text not null,
  comunidad text not null
);

alter table public.provincias enable row level security;
create policy "provincias legibles" on public.provincias for select using (true);

insert into public.provincias (code, name, comunidad) values
  ('VI', 'Álava', 'País Vasco'),
  ('AB', 'Albacete', 'Castilla-La Mancha'),
  ('A', 'Alicante', 'Comunidad Valenciana'),
  ('AL', 'Almería', 'Andalucía'),
  ('O', 'Asturias', 'Principado de Asturias'),
  ('AV', 'Ávila', 'Castilla y León'),
  ('BA', 'Badajoz', 'Extremadura'),
  ('PM', 'Baleares', 'Illes Balears'),
  ('B', 'Barcelona', 'Cataluña'),
  ('BU', 'Burgos', 'Castilla y León'),
  ('CC', 'Cáceres', 'Extremadura'),
  ('CA', 'Cádiz', 'Andalucía'),
  ('S', 'Cantabria', 'Cantabria'),
  ('CS', 'Castellón', 'Comunidad Valenciana'),
  ('CE', 'Ceuta', 'Ceuta'),
  ('CR', 'Ciudad Real', 'Castilla-La Mancha'),
  ('CO', 'Córdoba', 'Andalucía'),
  ('CU', 'Cuenca', 'Castilla-La Mancha'),
  ('GI', 'Girona', 'Cataluña'),
  ('GR', 'Granada', 'Andalucía'),
  ('GU', 'Guadalajara', 'Castilla-La Mancha'),
  ('SS', 'Gipuzkoa', 'País Vasco'),
  ('H', 'Huelva', 'Andalucía'),
  ('HU', 'Huesca', 'Aragón'),
  ('J', 'Jaén', 'Andalucía'),
  ('C', 'A Coruña', 'Galicia'),
  ('LO', 'La Rioja', 'La Rioja'),
  ('GC', 'Las Palmas', 'Canarias'),
  ('LE', 'León', 'Castilla y León'),
  ('L', 'Lleida', 'Cataluña'),
  ('LU', 'Lugo', 'Galicia'),
  ('M', 'Madrid', 'Comunidad de Madrid'),
  ('MA', 'Málaga', 'Andalucía'),
  ('ML', 'Melilla', 'Melilla'),
  ('MU', 'Murcia', 'Región de Murcia'),
  ('NA', 'Navarra', 'Comunidad Foral de Navarra'),
  ('OR', 'Ourense', 'Galicia'),
  ('P', 'Palencia', 'Castilla y León'),
  ('PO', 'Pontevedra', 'Galicia'),
  ('SA', 'Salamanca', 'Castilla y León'),
  ('TF', 'Santa Cruz de Tenerife', 'Canarias'),
  ('SG', 'Segovia', 'Castilla y León'),
  ('SE', 'Sevilla', 'Andalucía'),
  ('SO', 'Soria', 'Castilla y León'),
  ('T', 'Tarragona', 'Cataluña'),
  ('TE', 'Teruel', 'Aragón'),
  ('TO', 'Toledo', 'Castilla-La Mancha'),
  ('V', 'Valencia', 'Comunidad Valenciana'),
  ('VA', 'Valladolid', 'Castilla y León'),
  ('BI', 'Bizkaia', 'País Vasco'),
  ('ZA', 'Zamora', 'Castilla y León'),
  ('Z', 'Zaragoza', 'Aragón');

-- ---------------------------------------------------------------------------
-- Perfiles públicos
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default '' check (char_length(display_name) <= 50),
  avatar_url text,
  bio text not null default '' check (char_length(bio) <= 160),
  provincia text references public.provincias (code),
  onboarded boolean not null default false,
  x_connected boolean not null default false,
  x_username text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index profiles_username_trgm on public.profiles using gin (username extensions.gin_trgm_ops);
create index profiles_display_name_trgm on public.profiles using gin (display_name extensions.gin_trgm_ops);

-- Datos privados (solo el propio usuario): fecha de nacimiento y consentimientos.
create table public.profile_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  birthdate date not null,
  terms_accepted_at timestamptz not null default now(),
  x_consent_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Funciones auxiliares
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_service()
returns boolean
language sql
stable
as $$
  select coalesce(auth.role(), '') = 'service_role' or current_user in ('postgres', 'supabase_admin');
$$;

-- Crea el perfil vacío al registrarse (email, Google o X).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(meta ->> 'full_name', meta ->> 'name', meta ->> 'user_name', ''), 50),
    coalesce(meta ->> 'avatar_url', meta ->> 'picture')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Impide que un usuario se haga admin o marque X como conectado a mano.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if public.is_service() or public.is_admin() then
    return new;
  end if;
  if new.is_admin is distinct from old.is_admin
     or new.x_connected is distinct from old.x_connected
     or new.x_username is distinct from old.x_username
     or new.onboarded is distinct from old.onboarded
     or new.id is distinct from old.id then
    raise exception 'No puedes modificar ese campo' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Completa el perfil: valida edad mínima de 14 años (LOPDGDD) y aceptación de normas.
create or replace function public.complete_onboarding(
  p_username text,
  p_display_name text,
  p_provincia text,
  p_birthdate date,
  p_accept_terms boolean
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  if not coalesce(p_accept_terms, false) then
    raise exception 'Debes aceptar las normas y la política de privacidad' using errcode = '22023';
  end if;
  if p_birthdate is null or p_birthdate > (current_date - interval '14 years')::date then
    raise exception 'Debes tener al menos 14 años para usar FachApp' using errcode = '22023';
  end if;

  update public.profiles
     set username = lower(p_username),
         display_name = p_display_name,
         provincia = p_provincia,
         onboarded = true
   where id = auth.uid()
  returning * into result;

  insert into public.profile_private (user_id, birthdate)
  values (auth.uid(), p_birthdate)
  on conflict (user_id) do update set birthdate = excluded.birthdate, terms_accepted_at = now();

  return result;
end;
$$;

create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.profiles where username = lower(p_username) and id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;

create policy "perfiles públicos" on public.profiles
  for select using (true);
create policy "editar mi perfil" on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "ver mis datos privados" on public.profile_private
  for select to authenticated using (user_id = auth.uid());
create policy "editar mis datos privados" on public.profile_private
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: avatares (público) — cada usuario solo escribe en su carpeta uid/
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "avatares: subir en mi carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatares: actualizar los míos" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatares: borrar los míos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatares: leer" on storage.objects
  for select using (bucket_id = 'avatars');

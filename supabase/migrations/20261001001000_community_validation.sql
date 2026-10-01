-- Validación por la comunidad: usuarios al azar votan si una prueba sirve para el reto.
-- 5 votos a favor → reto superado. 10 votos en contra → reto fallido.
-- Los administradores pueden seguir validando directamente (review_attempt).

create or replace function public.community_approvals_needed() returns int language sql immutable as $$ select 5 $$;
create or replace function public.community_rejections_needed() returns int language sql immutable as $$ select 10 $$;

create table public.attempt_votes (
  attempt_id uuid not null references public.mission_attempts (id) on delete cascade,
  voter_id uuid not null references public.profiles (id) on delete cascade,
  approve boolean not null,
  created_at timestamptz not null default now(),
  primary key (attempt_id, voter_id)
);
create index attempt_votes_voter_idx on public.attempt_votes (voter_id);

alter table public.attempt_votes enable row level security;
-- Cada uno ve sus votos; el resto se consulta por RPC (recuentos, sin saber quién votó qué).
create policy "mis votos" on public.attempt_votes for select to authenticated using (voter_id = auth.uid());
-- Sin políticas de insert: solo vía vote_attempt().

-- Recuento de votos de una prueba (lo ve cualquiera; no revela quién votó).
create or replace function public.attempt_vote_counts(p_attempt_id uuid)
returns table (approvals int, rejections int, approvals_needed int, rejections_needed int)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*) filter (where approve)::int,
    count(*) filter (where not approve)::int,
    public.community_approvals_needed(),
    public.community_rejections_needed()
  from public.attempt_votes where attempt_id = p_attempt_id;
$$;

-- Pruebas pendientes para que yo las valide: al azar, de otros, sin mi voto, sin bloqueos.
create or replace function public.get_attempts_to_validate(p_limit int default 10)
returns table (
  attempt_id uuid,
  photo_url text,
  note text,
  created_at timestamptz,
  mission_id uuid,
  mission_title text,
  mission_description text,
  mission_points int,
  verification_type public.verification_type,
  approvals int,
  rejections int
)
language sql
volatile
security definer
set search_path = ''
as $$
  select a.id, a.photo_url, a.note, a.created_at, m.id, m.title, m.description, m.points,
         m.verification_type,
         (select count(*) from public.attempt_votes v where v.attempt_id = a.id and v.approve)::int,
         (select count(*) from public.attempt_votes v where v.attempt_id = a.id and not v.approve)::int
  from public.mission_attempts a
  join public.missions m on m.id = a.mission_id
  where auth.uid() is not null
    and a.status = 'pending'
    and a.user_id <> auth.uid()
    and m.verification_type in ('photo', 'manual')
    and not exists (select 1 from public.attempt_votes v where v.attempt_id = a.id and v.voter_id = auth.uid())
    and not public.is_blocked_between(auth.uid(), a.user_id)
  order by random()
  limit least(greatest(p_limit, 1), 30);
$$;

create or replace function public.pending_validations_count()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.mission_attempts a
  join public.missions m on m.id = a.mission_id
  where auth.uid() is not null
    and a.status = 'pending'
    and a.user_id <> auth.uid()
    and m.verification_type in ('photo', 'manual')
    and not exists (select 1 from public.attempt_votes v where v.attempt_id = a.id and v.voter_id = auth.uid())
    and not public.is_blocked_between(auth.uid(), a.user_id);
$$;

-- Votar. Al llegar al umbral, la prueba se resuelve (y los triggers crean post,
-- notificación e insignias igual que si la validara un admin).
create or replace function public.vote_attempt(p_attempt_id uuid, p_approve boolean)
returns table (status public.attempt_status, approvals int, rejections int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.mission_attempts;
  n_yes int;
  n_no int;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  select * into a from public.mission_attempts where id = p_attempt_id for update;
  if not found then
    raise exception 'La prueba no existe' using errcode = 'P0002';
  end if;
  if a.user_id = auth.uid() then
    raise exception 'No puedes votar tu propia prueba' using errcode = '42501';
  end if;
  if a.status <> 'pending' then
    raise exception 'Esta prueba ya está resuelta' using errcode = '22023';
  end if;

  insert into public.attempt_votes (attempt_id, voter_id, approve) values (p_attempt_id, auth.uid(), p_approve)
  on conflict (attempt_id, voter_id) do nothing;
  if not found then
    raise exception 'Ya has votado esta prueba' using errcode = '23505';
  end if;

  select count(*) filter (where approve), count(*) filter (where not approve)
    into n_yes, n_no
    from public.attempt_votes where attempt_id = p_attempt_id;

  if n_yes >= public.community_approvals_needed() then
    update public.mission_attempts
       set status = 'verified', verified_at = now(), review_note = 'Validado por la comunidad'
     where id = p_attempt_id;
    a.status := 'verified';
  elsif n_no >= public.community_rejections_needed() then
    update public.mission_attempts
       set status = 'rejected', verified_at = null,
           review_note = 'La comunidad ha votado que la prueba no sirve para el reto'
     where id = p_attempt_id;
    a.status := 'rejected';
  end if;

  return query select a.status, n_yes, n_no;
end;
$$;

revoke execute on function public.vote_attempt(uuid, boolean) from anon;
revoke execute on function public.get_attempts_to_validate(int) from anon;

-- Las fotos pendientes deben poder verlas quienes votan (cualquier usuario con sesión).
drop policy "pruebas: leer" on storage.objects;
create policy "pruebas: leer" on storage.objects
  for select using (
    bucket_id = 'proofs' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
      or exists (
        select 1 from public.mission_attempts a
        where a.photo_url = 'proofs/' || name
          and (a.status = 'verified' or (a.status = 'pending' and auth.uid() is not null))
      )
    )
  );

-- Insignia por ayudar a validar
insert into public.badges (code, name, description, icon, sort_order) values
  ('arbitro', 'Árbitro', 'Vota 20 pruebas de otros usuarios', 'arbitro', 130);

create or replace function public.award_voter_badge()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.attempt_votes where voter_id = new.voter_id) >= 20 then
    insert into public.user_badges (user_id, badge_code) values (new.voter_id, 'arbitro')
    on conflict do nothing;
    if found then
      insert into public.notifications (user_id, type, payload)
      values (new.voter_id, 'badge', jsonb_build_object('badge_code', 'arbitro', 'badge_name', 'Árbitro', 'icon', 'arbitro'));
    end if;
  end if;
  return new;
end;
$$;

create trigger attempt_votes_badge after insert on public.attempt_votes
  for each row execute function public.award_voter_badge();

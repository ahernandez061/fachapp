-- Fase 5 — Gamificación: puntos, niveles, insignias y rankings

-- ---------------------------------------------------------------------------
-- Niveles: nivel n requiere 50·n·(n-1) puntos (0, 100, 300, 600, 1000…)
-- ---------------------------------------------------------------------------
create or replace function public.level_for_points(p_points int)
returns int
language sql
immutable
as $$
  select greatest(1, floor((1 + sqrt(1 + 8 * greatest(p_points, 0) / 100.0)) / 2)::int);
$$;

-- ---------------------------------------------------------------------------
-- Insignias
-- ---------------------------------------------------------------------------
create table public.badges (
  code text primary key,
  name text not null,
  description text not null,
  icon text not null,
  sort_order int not null default 0
);

create table public.user_badges (
  user_id uuid not null references public.profiles (id) on delete cascade,
  badge_code text not null references public.badges (code) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_code)
);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
create policy "insignias visibles" on public.badges for select using (true);
create policy "admins gestionan insignias" on public.badges
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "insignias de usuarios visibles" on public.user_badges for select using (true);

insert into public.badges (code, name, description, icon, sort_order) values
  ('primera_mision', 'Primer paso', 'Completa tu primera misión', 'first-step', 10),
  ('cinco_misiones', 'En racha', 'Completa 5 misiones', 'streak', 20),
  ('diez_misiones', 'Imparable', 'Completa 10 misiones', 'unstoppable', 30),
  ('fotografo', 'Fotógrafo', 'Completa 3 misiones con foto', 'camera', 40),
  ('conectado_x', 'Conectado', 'Conecta tu cuenta de X', 'x-link', 50),
  ('sociable', 'Sociable', 'Sigue a 5 personas', 'social', 60),
  ('popular', 'Popular', 'Consigue 10 seguidores', 'star', 70),
  ('quinientos', 'Leyenda', 'Alcanza 500 puntos', 'crown', 80);

-- Otorga las insignias que el usuario cumpla (idempotente).
create or replace function public.award_badges(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  completed int;
  photo_completed int;
  total_points int;
  following int;
  followers int;
  is_x boolean;
  v_code text;
begin
  select count(*), count(*) filter (where m.verification_type = 'photo'), coalesce(sum(m.points), 0)
    into completed, photo_completed, total_points
    from public.mission_attempts a join public.missions m on m.id = a.mission_id
   where a.user_id = p_user_id and a.status = 'verified';
  select count(*) into following from public.follows where follower_id = p_user_id;
  select count(*) into followers from public.follows where following_id = p_user_id;
  select x_connected into is_x from public.profiles where id = p_user_id;

  for v_code in
    select c from (values
      ('primera_mision', completed >= 1),
      ('cinco_misiones', completed >= 5),
      ('diez_misiones', completed >= 10),
      ('fotografo', photo_completed >= 3),
      ('conectado_x', coalesce(is_x, false)),
      ('sociable', following >= 5),
      ('popular', followers >= 10),
      ('quinientos', total_points >= 500)
    ) as t(c, ok)
    where ok
  loop
    insert into public.user_badges (user_id, badge_code) values (p_user_id, v_code)
    on conflict do nothing;
    if found then
      insert into public.notifications (user_id, type, payload)
      select p_user_id, 'badge', jsonb_build_object('badge_code', b.code, 'badge_name', b.name, 'icon', b.icon)
        from public.badges b where b.code = v_code;
    end if;
  end loop;
end;
$$;

revoke execute on function public.award_badges(uuid) from anon, authenticated;

create or replace function public.trigger_award_badges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'mission_attempts' then
    if new.status = 'verified' then perform public.award_badges(new.user_id); end if;
  elsif tg_table_name = 'follows' then
    perform public.award_badges(new.follower_id);
    perform public.award_badges(new.following_id);
  elsif tg_table_name = 'profiles' then
    if new.x_connected and not coalesce(old.x_connected, false) then perform public.award_badges(new.id); end if;
  end if;
  return new;
end;
$$;

create trigger mission_attempts_badges after insert or update of status on public.mission_attempts
  for each row execute function public.trigger_award_badges();
create trigger follows_badges after insert on public.follows
  for each row execute function public.trigger_award_badges();
create trigger profiles_badges after update of x_connected on public.profiles
  for each row execute function public.trigger_award_badges();

-- ---------------------------------------------------------------------------
-- Ranking. La semana va de lunes a domingo en hora de Madrid.
-- ---------------------------------------------------------------------------
create or replace function public.week_start()
returns timestamptz
language sql
stable
as $$
  select date_trunc('week', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid';
$$;

create view public.leaderboard with (security_invoker = on) as
select
  pr.id as user_id,
  pr.username,
  pr.display_name,
  pr.avatar_url,
  pr.provincia,
  coalesce(sum(m.points), 0)::int as total_points,
  coalesce(sum(m.points) filter (where a.verified_at >= public.week_start()), 0)::int as weekly_points,
  count(a.id)::int as missions_completed,
  public.level_for_points(coalesce(sum(m.points), 0)::int) as level
from public.profiles pr
left join public.mission_attempts a on a.user_id = pr.id and a.status = 'verified'
left join public.missions m on m.id = a.mission_id
where pr.onboarded
group by pr.id;

-- scope: 'global' | 'weekly' | 'friends' | 'provincia'
create or replace function public.get_leaderboard(p_scope text default 'global', p_provincia text default null, p_limit int default 50)
returns table (
  rank bigint,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  provincia text,
  points int,
  missions_completed int,
  level int
)
language sql
stable
set search_path = ''
as $$
  with base as (
    select l.*, case when p_scope = 'weekly' then l.weekly_points else l.total_points end as pts
    from public.leaderboard l
    where (p_scope <> 'provincia' or l.provincia = p_provincia)
      and (p_scope <> 'friends' or l.user_id = auth.uid() or exists (
        select 1 from public.follows f where f.follower_id = auth.uid() and f.following_id = l.user_id))
  ),
  ranked as (
    select rank() over (order by pts desc) as rank, b.* from base b
  )
  select r.rank, r.user_id, r.username, r.display_name, r.avatar_url, r.provincia,
         r.pts, r.missions_completed, r.level
  from ranked r
  where r.pts > 0 or r.user_id = auth.uid()
  order by r.rank, r.username
  limit least(greatest(p_limit, 1), 100);
$$;

-- Estadísticas de un perfil (puntos, nivel, seguidores…)
create or replace function public.get_profile_stats(p_user_id uuid)
returns table (
  total_points int,
  weekly_points int,
  missions_completed int,
  level int,
  followers int,
  following int,
  global_rank bigint
)
language sql
stable
set search_path = ''
as $$
  select
    coalesce(l.total_points, 0),
    coalesce(l.weekly_points, 0),
    coalesce(l.missions_completed, 0),
    coalesce(l.level, 1),
    (select count(*)::int from public.follows where following_id = p_user_id),
    (select count(*)::int from public.follows where follower_id = p_user_id),
    (select r.rk from (select user_id, rank() over (order by total_points desc) rk from public.leaderboard) r where r.user_id = p_user_id)
  from (select 1) one
  left join public.leaderboard l on l.user_id = p_user_id;
$$;

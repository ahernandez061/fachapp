-- Más red social: reto destacado, tendencias, hashtags e insignias sociales

-- ---------------------------------------------------------------------------
-- Reto de la semana (misión destacada en el feed)
-- ---------------------------------------------------------------------------
alter table public.missions add column featured boolean not null default false;

-- ---------------------------------------------------------------------------
-- Hashtags: se extraen del texto de los posts (#Croquetas → croquetas)
-- ---------------------------------------------------------------------------
create or replace function public.extract_hashtags(p_text text)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(distinct lower(m[1])), '{}')
  from regexp_matches(coalesce(p_text, ''), '#([[:alnum:]_áéíóúñüÁÉÍÓÚÑÜ]{2,40})', 'g') as m;
$$;

alter table public.posts
  add column hashtags text[] generated always as (public.extract_hashtags(text)) stored;
create index posts_hashtags_idx on public.posts using gin (hashtags);

-- La vista del feed expone los hashtags (se recrea añadiendo la columna al final).
create or replace view public.post_feed with (security_invoker = on) as
select
  p.id,
  p.user_id,
  p.mission_attempt_id,
  p.text,
  p.images,
  p.hidden,
  p.created_at,
  pr.username,
  pr.display_name,
  pr.avatar_url,
  pr.provincia,
  m.id as mission_id,
  m.title as mission_title,
  m.points as mission_points,
  m.verification_type as mission_verification_type,
  (select count(*) from public.likes l where l.post_id = p.id)::int as like_count,
  (select count(*) from public.comments c where c.post_id = p.id)::int as comment_count,
  exists (select 1 from public.likes l where l.post_id = p.id and l.user_id = auth.uid()) as liked_by_me,
  p.hashtags
from public.posts p
join public.profiles pr on pr.id = p.user_id
left join public.mission_attempts a on a.id = p.mission_attempt_id
left join public.missions m on m.id = a.mission_id;

-- Posts con un hashtag (paginado por fecha)
create or replace function public.get_posts_by_tag(p_tag text, p_before timestamptz default null, p_limit int default 30)
returns setof public.post_feed
language sql
stable
set search_path = ''
as $$
  select f.* from public.post_feed f
  where f.hashtags @> array[lower(trim(leading '#' from p_tag))]
    and not f.hidden
    and (p_before is null or f.created_at < p_before)
  order by f.created_at desc
  limit least(greatest(p_limit, 1), 60);
$$;

-- Fotos en tendencia: las más gustadas de los últimos N días
create or replace function public.get_trending_posts(p_days int default 7, p_limit int default 30)
returns setof public.post_feed
language sql
stable
set search_path = ''
as $$
  select f.* from public.post_feed f
  where cardinality(f.images) > 0
    and not f.hidden
    and f.created_at > now() - make_interval(days => least(greatest(p_days, 1), 90))
  order by f.like_count desc, f.comment_count desc, f.created_at desc
  limit least(greatest(p_limit, 1), 60);
$$;

-- Hashtags más usados de los últimos N días
create or replace function public.get_trending_hashtags(p_days int default 30, p_limit int default 12)
returns table (tag text, uses int)
language sql
stable
set search_path = ''
as $$
  select t.tag, count(*)::int as uses
  from public.posts p, unnest(p.hashtags) as t(tag)
  where not p.hidden
    and p.created_at > now() - make_interval(days => least(greatest(p_days, 1), 365))
    and not public.is_blocked_between(auth.uid(), p.user_id)
  group by t.tag
  order by uses desc, t.tag
  limit least(greatest(p_limit, 1), 50);
$$;

-- ---------------------------------------------------------------------------
-- Insignias sociales
-- ---------------------------------------------------------------------------
insert into public.badges (code, name, description, icon, sort_order) values
  ('paparazzi', 'Paparazzi', 'Publica 5 posts con foto', 'paparazzi', 90),
  ('influencer', 'Influencer de barrio', 'Recibe 25 me gusta en tus publicaciones', 'influencer', 100),
  ('tertuliano', 'Tertuliano', 'Escribe 10 comentarios', 'tertuliano', 110),
  ('croquetero', 'Croquetero', 'Completa 3 misiones de gastronomía', 'croquetero', 120);

create or replace function public.award_badges(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  completed int;
  photo_completed int;
  food_completed int;
  total_points int;
  following int;
  followers int;
  photo_posts int;
  likes_received int;
  comments_written int;
  is_x boolean;
  v_code text;
begin
  select count(*),
         count(*) filter (where m.verification_type = 'photo'),
         count(*) filter (where m.category = 'gastronomía'),
         coalesce(sum(m.points), 0)
    into completed, photo_completed, food_completed, total_points
    from public.mission_attempts a join public.missions m on m.id = a.mission_id
   where a.user_id = p_user_id and a.status = 'verified';
  select count(*) into following from public.follows where follower_id = p_user_id;
  select count(*) into followers from public.follows where following_id = p_user_id;
  select count(*) into photo_posts from public.posts where user_id = p_user_id and cardinality(images) > 0;
  select count(*) into likes_received
    from public.likes l join public.posts p on p.id = l.post_id where p.user_id = p_user_id;
  select count(*) into comments_written from public.comments where user_id = p_user_id;
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
      ('quinientos', total_points >= 500),
      ('paparazzi', photo_posts >= 5),
      ('influencer', likes_received >= 25),
      ('tertuliano', comments_written >= 10),
      ('croquetero', food_completed >= 3)
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
  elsif tg_table_name = 'posts' then
    if cardinality(new.images) > 0 then perform public.award_badges(new.user_id); end if;
  elsif tg_table_name = 'likes' then
    perform public.award_badges((select user_id from public.posts where id = new.post_id));
  elsif tg_table_name = 'comments' then
    perform public.award_badges(new.user_id);
  end if;
  return new;
end;
$$;

create trigger posts_badges after insert on public.posts
  for each row execute function public.trigger_award_badges();
create trigger likes_badges after insert on public.likes
  for each row execute function public.trigger_award_badges();
create trigger comments_badges after insert on public.comments
  for each row execute function public.trigger_award_badges();

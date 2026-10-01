-- Fase 4 — Red social: posts, follows, likes, comentarios, bloqueos, reportes y notificaciones

-- ---------------------------------------------------------------------------
-- Filtro de lenguaje ofensivo
-- ---------------------------------------------------------------------------
create table public.banned_words (word text primary key);
alter table public.banned_words enable row level security;
create policy "admins gestionan palabras" on public.banned_words
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.banned_words (word) values
  ('gilipollas'), ('subnormal'), ('maricón'), ('maricon'), ('puta'), ('zorra'),
  ('hijo de puta'), ('hijoputa'), ('retrasado'), ('mongolo'), ('sudaca'), ('moro de mierda'),
  ('panchito'), ('negrata'), ('tortillera'), ('bollera'), ('cabrón'), ('cabron'),
  ('mamón'), ('mamon'), ('capullo'), ('imbécil'), ('imbecil'), ('malnacido'), ('muérete'), ('muerete');

create or replace function public.contains_offensive(p_text text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.banned_words w
    where lower(coalesce(p_text, '')) ~ ('(^|[^[:alnum:]áéíóúñü])' || w.word || '($|[^[:alnum:]áéíóúñü])')
  );
$$;

create or replace function public.reject_offensive()
returns trigger
language plpgsql
as $$
declare
  value text := to_jsonb(new) ->> tg_argv[0];
begin
  if public.contains_offensive(value) then
    raise exception 'El texto contiene lenguaje ofensivo. Revisa las normas de la comunidad.'
      using errcode = '22023', hint = 'offensive_language';
  end if;
  return new;
end;
$$;

create trigger profiles_bio_offensive before insert or update of bio on public.profiles
  for each row execute function public.reject_offensive('bio');
create trigger profiles_name_offensive before insert or update of display_name on public.profiles
  for each row execute function public.reject_offensive('display_name');

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mission_attempt_id uuid unique references public.mission_attempts (id) on delete cascade,
  text text not null default '' check (char_length(text) <= 500),
  images text[] not null default '{}' check (cardinality(images) <= 4),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index posts_created_idx on public.posts (created_at desc);
create index posts_user_idx on public.posts (user_id, created_at desc);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

create table public.likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index likes_post_idx on public.likes (post_id);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null check (char_length(trim(text)) between 1 and 300),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create type public.report_target as enum ('post', 'comment', 'user');
create type public.report_status as enum ('open', 'resolved', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'acoso', 'odio', 'contenido_sexual', 'violencia', 'suplantacion', 'otro')),
  details text check (char_length(details) <= 500),
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create trigger posts_offensive before insert or update of text on public.posts
  for each row execute function public.reject_offensive('text');
create trigger comments_offensive before insert or update of text on public.comments
  for each row execute function public.reject_offensive('text');

-- ---------------------------------------------------------------------------
-- Bloqueos
-- ---------------------------------------------------------------------------
create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select a is not null and b is not null and exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- Al bloquear se rompen los follows en ambos sentidos.
create or replace function public.on_block()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.follows
   where (follower_id = new.blocker_id and following_id = new.blocked_id)
      or (follower_id = new.blocked_id and following_id = new.blocker_id);
  return new;
end;
$$;
create trigger blocks_after_insert after insert on public.blocks
  for each row execute function public.on_block();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

create policy "posts visibles" on public.posts for select using (
  user_id = auth.uid() or public.is_admin()
  or (not hidden and not public.is_blocked_between(auth.uid(), user_id))
);
create policy "crear mis posts" on public.posts for insert to authenticated with check (
  user_id = auth.uid()
  and (mission_attempt_id is null or exists (
    select 1 from public.mission_attempts a where a.id = mission_attempt_id and a.user_id = auth.uid()
  ))
);
create policy "editar mis posts" on public.posts for update to authenticated
  using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());
create policy "borrar mis posts" on public.posts for delete to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "follows visibles" on public.follows for select using (true);
create policy "seguir" on public.follows for insert to authenticated
  with check (follower_id = auth.uid() and not public.is_blocked_between(follower_id, following_id));
create policy "dejar de seguir" on public.follows for delete to authenticated
  using (follower_id = auth.uid());

create policy "likes visibles" on public.likes for select using (true);
create policy "dar like" on public.likes for insert to authenticated with check (user_id = auth.uid());
create policy "quitar like" on public.likes for delete to authenticated using (user_id = auth.uid());

create policy "comentarios visibles" on public.comments for select using (
  user_id = auth.uid() or public.is_admin() or not public.is_blocked_between(auth.uid(), user_id)
);
create policy "comentar" on public.comments for insert to authenticated with check (
  user_id = auth.uid()
  and exists (select 1 from public.posts p where p.id = post_id
              and not p.hidden and not public.is_blocked_between(auth.uid(), p.user_id))
);
create policy "borrar comentario" on public.comments for delete to authenticated using (
  user_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.posts p where p.id = post_id and p.user_id = auth.uid())
);

create policy "mis bloqueos" on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy "bloquear" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "desbloquear" on public.blocks for delete to authenticated using (blocker_id = auth.uid());

create policy "ver reportes" on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
create policy "reportar" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy "gestionar reportes" on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "mis notificaciones" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "marcar leídas" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "borrar notificaciones" on public.notifications for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Vista del feed (respeta RLS del que consulta)
-- ---------------------------------------------------------------------------
create view public.post_feed with (security_invoker = on) as
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
  exists (select 1 from public.likes l where l.post_id = p.id and l.user_id = auth.uid()) as liked_by_me
from public.posts p
join public.profiles pr on pr.id = p.user_id
left join public.mission_attempts a on a.id = p.mission_attempt_id
left join public.missions m on m.id = a.mission_id;

-- Feed paginado por cursor: 'following' (seguidos + yo) o 'discover' (todos).
create or replace function public.get_feed(p_mode text default 'discover', p_before timestamptz default null, p_limit int default 20)
returns setof public.post_feed
language sql
stable
set search_path = ''
as $$
  select f.* from public.post_feed f
  where (p_before is null or f.created_at < p_before)
    and not f.hidden
    and (
      p_mode = 'discover'
      or f.user_id = auth.uid()
      or exists (select 1 from public.follows fo where fo.follower_id = auth.uid() and fo.following_id = f.user_id)
    )
  order by f.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- ---------------------------------------------------------------------------
-- Post automático al completar una misión
-- ---------------------------------------------------------------------------
create or replace function public.on_attempt_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.missions;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;
  select * into m from public.missions where id = new.mission_id;

  if new.status = 'verified' then
    insert into public.posts (user_id, mission_attempt_id, text, images)
    values (
      new.user_id, new.id, coalesce(new.note, ''),
      case when new.photo_url is not null then array[new.photo_url] else '{}'::text[] end
    )
    on conflict (mission_attempt_id) do nothing;

    insert into public.notifications (user_id, type, payload)
    values (new.user_id, 'mission_verified',
            jsonb_build_object('mission_id', m.id, 'mission_title', m.title, 'points', m.points));
  elsif new.status = 'rejected' and m.verification_type <> 'x_auto' then
    insert into public.notifications (user_id, type, payload)
    values (new.user_id, 'mission_rejected',
            jsonb_build_object('mission_id', m.id, 'mission_title', m.title, 'note', new.review_note));
  end if;
  return new;
end;
$$;

create trigger mission_attempts_status
  after insert or update of status on public.mission_attempts
  for each row execute function public.on_attempt_status_change();

-- ---------------------------------------------------------------------------
-- Notificaciones sociales
-- ---------------------------------------------------------------------------
create or replace function public.notify_social()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  target uuid;
  payload jsonb;
begin
  if tg_table_name = 'follows' then
    select * into actor from public.profiles where id = new.follower_id;
    target := new.following_id;
    payload := '{}'::jsonb;
  elsif tg_table_name = 'likes' then
    select * into actor from public.profiles where id = new.user_id;
    select user_id into target from public.posts where id = new.post_id;
    payload := jsonb_build_object('post_id', new.post_id);
  else -- comments
    select * into actor from public.profiles where id = new.user_id;
    select user_id into target from public.posts where id = new.post_id;
    payload := jsonb_build_object('post_id', new.post_id, 'comment', left(new.text, 80));
  end if;

  if target is null or target = actor.id then
    return new;
  end if;

  insert into public.notifications (user_id, type, payload)
  values (
    target,
    case tg_table_name when 'follows' then 'follow' when 'likes' then 'like' else 'comment' end,
    payload || jsonb_build_object(
      'actor_id', actor.id, 'actor_username', actor.username,
      'actor_name', actor.display_name, 'actor_avatar', actor.avatar_url
    )
  );
  return new;
end;
$$;

create trigger follows_notify after insert on public.follows for each row execute function public.notify_social();
create trigger likes_notify after insert on public.likes for each row execute function public.notify_social();
create trigger comments_notify after insert on public.comments for each row execute function public.notify_social();

-- Realtime para notificaciones
alter publication supabase_realtime add table public.notifications;

-- ---------------------------------------------------------------------------
-- Storage: imágenes de posts (público)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('posts', 'posts', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "posts img: subir en mi carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "posts img: borrar las mías" on storage.objects
  for delete to authenticated
  using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "posts img: leer" on storage.objects for select using (bucket_id = 'posts');

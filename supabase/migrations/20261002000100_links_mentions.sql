-- Instagram en el perfil y notificaciones por @mención

-- Instagram no ofrece login para cuentas personales (la Basic Display API cerró en
-- diciembre de 2024): guardamos el usuario para enlazar el perfil.
alter table public.profiles
  add column instagram_username text
    check (instagram_username ~ '^[a-z0-9._]{1,30}$');

-- ---------------------------------------------------------------------------
-- Menciones: @usuario en un post o comentario avisa a esa persona.
-- Máximo 5 menciones por texto (las normas prohíben mencionar en masa).
-- ---------------------------------------------------------------------------
create or replace function public.extract_mentions(p_text text)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(u order by first), '{}')
  from (
    select lower(m[2]) as u, min(ord) as first
    from regexp_matches(coalesce(p_text, ''), '(^|[^[:alnum:]_@])@([[:alnum:]_]{2,40})', 'g')
      with ordinality as t(m, ord)
    group by lower(m[2])
    order by min(ord)
    limit 5
  ) s;
$$;

create or replace function public.notify_mentions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor public.profiles;
  target public.profiles;
  v_post uuid;
  v_text text := new.text;
begin
  if tg_op = 'UPDATE' and new.text is not distinct from old.text then
    return new;
  end if;
  select * into actor from public.profiles where id = new.user_id;
  v_post := case when tg_table_name = 'posts' then new.id else new.post_id end;

  for target in
    select p.* from public.profiles p
    where p.username = any (public.extract_mentions(v_text))
      and p.id <> new.user_id
      and not public.is_blocked_between(p.id, new.user_id)
  loop
    insert into public.notifications (user_id, type, payload)
    values (target.id, 'mention', jsonb_build_object(
      'post_id', v_post,
      'where', tg_table_name,
      'excerpt', left(v_text, 80),
      'actor_id', actor.id, 'actor_username', actor.username,
      'actor_name', actor.display_name, 'actor_avatar', actor.avatar_url
    ));
  end loop;
  return new;
end;
$$;

create trigger posts_mentions after insert or update of text on public.posts
  for each row execute function public.notify_mentions();
create trigger comments_mentions after insert on public.comments
  for each row execute function public.notify_mentions();

-- Corrige notify_mentions(): PL/pgSQL evaluaba new.post_id también en la tabla posts
-- (que no tiene esa columna) y la inserción del post fallaba.
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
  v_text text;
begin
  if tg_table_name = 'posts' then
    if tg_op = 'UPDATE' and new.text is not distinct from old.text then
      return new;
    end if;
    v_post := new.id;
  else
    v_post := (to_jsonb(new) ->> 'post_id')::uuid;
  end if;
  v_text := to_jsonb(new) ->> 'text';
  select * into actor from public.profiles where id = new.user_id;

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

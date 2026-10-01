-- Fase 6 — Derechos RGPD: exportar y borrar mis datos

create or replace function public.export_my_data()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'private', (select to_jsonb(pp) from public.profile_private pp where pp.user_id = auth.uid()),
    'email', (select email from auth.users where id = auth.uid()),
    'x_account', (select jsonb_build_object('x_user_id', x.x_user_id, 'x_username', x.x_username,
                   'scopes', x.scopes, 'connected_at', x.connected_at)
                  from public.x_accounts x where x.user_id = auth.uid()),
    'mission_attempts', coalesce((select jsonb_agg(to_jsonb(a)) from public.mission_attempts a where a.user_id = auth.uid()), '[]'),
    'posts', coalesce((select jsonb_agg(to_jsonb(p)) from public.posts p where p.user_id = auth.uid()), '[]'),
    'comments', coalesce((select jsonb_agg(to_jsonb(c)) from public.comments c where c.user_id = auth.uid()), '[]'),
    'likes', coalesce((select jsonb_agg(to_jsonb(l)) from public.likes l where l.user_id = auth.uid()), '[]'),
    'following', coalesce((select jsonb_agg(f.following_id) from public.follows f where f.follower_id = auth.uid()), '[]'),
    'followers', coalesce((select jsonb_agg(f.follower_id) from public.follows f where f.following_id = auth.uid()), '[]'),
    'blocks', coalesce((select jsonb_agg(b.blocked_id) from public.blocks b where b.blocker_id = auth.uid()), '[]'),
    'reports', coalesce((select jsonb_agg(to_jsonb(r)) from public.reports r where r.reporter_id = auth.uid()), '[]'),
    'badges', coalesce((select jsonb_agg(to_jsonb(ub)) from public.user_badges ub where ub.user_id = auth.uid()), '[]'),
    'notifications', coalesce((select jsonb_agg(to_jsonb(n)) from public.notifications n where n.user_id = auth.uid()), '[]')
  );
$$;

-- Borra la cuenta y todo en cascada. Los ficheros de Storage los borra antes el cliente.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.export_my_data() from anon;
revoke execute on function public.delete_my_account() from anon;

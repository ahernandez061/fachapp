-- Fase 7 — Al crear una notificación, avisa a la Edge Function send-push (si el usuario
-- tiene dispositivos registrados). Usa pg_net (HTTP asíncrono) y dos secretos del Vault:
--   functions_url     p. ej. https://<proyecto>.supabase.co/functions/v1
--   service_role_key  la service_role key del proyecto
-- Si no existen, no se envía nada (la notificación in-app funciona igual).
create extension if not exists pg_net with schema extensions;

create or replace function public.dispatch_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fn_url text;
  key text;
begin
  if not exists (select 1 from public.push_tokens where user_id = new.user_id) then
    return new;
  end if;
  select decrypted_secret into fn_url from vault.decrypted_secrets where name = 'functions_url';
  select decrypted_secret into key from vault.decrypted_secrets where name = 'service_role_key';
  if fn_url is null or key is null then
    return new;
  end if;
  perform net.http_post(
    url := fn_url || '/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json', 'Authorization', 'Bearer ' || key, 'apikey', key
    ),
    body := jsonb_build_object('notification_id', new.id)
  );
  return new;
exception when others then
  -- El push nunca debe impedir que se cree la notificación.
  raise warning 'dispatch_push: %', sqlerrm;
  return new;
end;
$$;

create trigger notifications_push after insert on public.notifications
  for each row execute function public.dispatch_push();

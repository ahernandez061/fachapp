-- Premios: se canjean con los puntos ganados (temas de color, marcos de avatar, títulos
-- e insignias exclusivas). Canjear NO resta puntos del ranking: hay un saldo aparte
-- (puntos totales - puntos ya canjeados).

create type public.reward_kind as enum ('theme', 'frame', 'title', 'badge');

create table public.rewards (
  code text primary key,
  kind public.reward_kind not null,
  name text not null,
  description text not null,
  cost int not null check (cost >= 0),
  sort_order int not null default 0,
  active boolean not null default true
);

create table public.user_rewards (
  user_id uuid not null references public.profiles (id) on delete cascade,
  reward_code text not null references public.rewards (code) on delete cascade,
  purchased_at timestamptz not null default now(),
  primary key (user_id, reward_code)
);

alter table public.profiles
  add column equipped_theme text references public.rewards (code) on delete set null,
  add column equipped_frame text references public.rewards (code) on delete set null,
  add column equipped_title text references public.rewards (code) on delete set null;

alter table public.rewards enable row level security;
alter table public.user_rewards enable row level security;
create policy "premios visibles" on public.rewards for select using (active or public.is_admin());
create policy "admins gestionan premios" on public.rewards
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "premios de usuarios visibles" on public.user_rewards for select using (true);
-- Sin insert directo: solo vía buy_reward().

-- Los equipados solo se cambian con equip_reward() (que comprueba que lo tienes).
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
     or new.equipped_theme is distinct from old.equipped_theme
     or new.equipped_frame is distinct from old.equipped_frame
     or new.equipped_title is distinct from old.equipped_title
     or new.id is distinct from old.id then
    raise exception 'No puedes modificar ese campo' using errcode = '42501';
  end if;
  return new;
end;
$$;

-- Saldo canjeable
create or replace function public.points_balance(p_user_id uuid default null)
returns table (total_points int, spent int, balance int)
language sql
stable
security definer
set search_path = ''
as $$
  with u as (select coalesce(p_user_id, auth.uid()) as id),
  earned as (
    select coalesce(sum(m.points), 0)::int as pts
    from public.mission_attempts a join public.missions m on m.id = a.mission_id, u
    where a.user_id = u.id and a.status = 'verified'
  ),
  used as (
    select coalesce(sum(r.cost), 0)::int as pts
    from public.user_rewards ur join public.rewards r on r.code = ur.reward_code, u
    where ur.user_id = u.id
  )
  select earned.pts, used.pts, earned.pts - used.pts from earned, used;
$$;

create or replace function public.buy_reward(p_code text)
returns table (balance int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rewards;
  bal int;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  select * into r from public.rewards where code = p_code and active;
  if not found then
    raise exception 'Ese premio no existe' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.user_rewards where user_id = auth.uid() and reward_code = p_code) then
    raise exception 'Ya tienes este premio' using errcode = '23505';
  end if;
  -- Bloquea al usuario para evitar dos canjes simultáneos con el mismo saldo.
  perform 1 from public.profiles where id = auth.uid() for update;
  select b.balance into bal from public.points_balance(auth.uid()) b;
  if bal < r.cost then
    raise exception 'Te faltan % puntos para canjear «%»', r.cost - bal, r.name using errcode = '22023';
  end if;

  insert into public.user_rewards (user_id, reward_code) values (auth.uid(), p_code);
  -- Las insignias exclusivas aparecen junto al resto de insignias del perfil.
  if r.kind = 'badge' then
    insert into public.user_badges (user_id, badge_code) values (auth.uid(), p_code) on conflict do nothing;
  end if;
  return query select bal - r.cost;
end;
$$;

-- Equipa (o quita, con p_code = null) un tema, marco o título.
create or replace function public.equip_reward(p_kind public.reward_kind, p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión' using errcode = '42501';
  end if;
  if p_kind = 'badge' then
    raise exception 'Las insignias no se equipan' using errcode = '22023';
  end if;
  if p_code is not null and not exists (
    select 1 from public.user_rewards ur join public.rewards r on r.code = ur.reward_code
    where ur.user_id = auth.uid() and ur.reward_code = p_code and r.kind = p_kind
  ) then
    raise exception 'Primero tienes que canjear ese premio' using errcode = '42501';
  end if;
  update public.profiles
     set equipped_theme = case when p_kind = 'theme' then p_code else equipped_theme end,
         equipped_frame = case when p_kind = 'frame' then p_code else equipped_frame end,
         equipped_title = case when p_kind = 'title' then p_code else equipped_title end
   where id = auth.uid();
end;
$$;

revoke execute on function public.buy_reward(text) from anon;
revoke execute on function public.equip_reward(public.reward_kind, text) from anon;

-- ---------------------------------------------------------------------------
-- Catálogo inicial
-- ---------------------------------------------------------------------------
insert into public.rewards (code, kind, name, description, cost, sort_order) values
  ('tema_rojigualda', 'theme', 'Rojigualda', 'La app en rojo y gualda, como la bandera.', 100, 10),
  ('tema_azul_marino', 'theme', 'Azul marino', 'Elegante y clásico, color Armada.', 150, 20),
  ('tema_verde_olivo', 'theme', 'Verde olivo', 'Del color de nuestros olivares (y del AOVE).', 150, 30),
  ('tema_morado', 'theme', 'Morado nazareno', 'Para los de Semana Santa todo el año.', 200, 40),
  ('tema_oro', 'theme', 'Oro', 'Para quien lo ha ganado todo. Brilla, pero con clase.', 600, 50),
  ('marco_rojigualda', 'frame', 'Marco rojigualda', 'Tu foto de perfil rodeada de los colores de España.', 120, 10),
  ('marco_oro', 'frame', 'Marco de oro', 'Un aro dorado alrededor de tu avatar. Nivel leyenda.', 400, 20),
  ('marco_plata', 'frame', 'Marco de plata', 'Discreto pero se nota.', 200, 15),
  ('titulo_patriota', 'title', 'Patriota', 'Aparece bajo tu nombre: «Patriota».', 80, 10),
  ('titulo_tortilla', 'title', 'Embajador de la tortilla', 'Con o sin cebolla, pero embajador.', 100, 20),
  ('titulo_cunado', 'title', 'Cuñado oficial', 'Tú lo arreglas todo en un momento.', 100, 30),
  ('titulo_leyenda', 'title', 'Leyenda de FachApp', 'Solo para los más veteranos.', 500, 40),
  ('insignia_mecenas', 'badge', 'Mecenas', 'Insignia exclusiva por canjear tus puntos.', 250, 10),
  ('insignia_toro', 'badge', 'Toro bravo', 'Insignia exclusiva del toro de Osborne.', 300, 20);

-- Las insignias canjeables también son insignias normales (para mostrarlas en el perfil).
insert into public.badges (code, name, description, icon, sort_order) values
  ('insignia_mecenas', 'Mecenas', 'Canjeada en Premios', 'mecenas', 200),
  ('insignia_toro', 'Toro bravo', 'Canjeada en Premios', 'toro', 210);

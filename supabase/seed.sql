-- Datos de DESARROLLO. Se cargan con `npm run db:reset` (o `supabase db reset`).
-- Usuarios demo (contraseña de todos: fachapp123):
--   usuario@fachapp.local (usuario normal de pruebas) y admin@fachapp.local (administrador)
--   lucia@, pablo@, marta@, javi@, sara@, dani@fachapp.local (comunidad de ejemplo)
-- Las imágenes son placeholders libres de picsum.photos.

-- ---------------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------------
create temporary table demo_users (id uuid, email text, username text, display_name text, provincia text, bio text, is_admin boolean);
insert into demo_users values
  ('00000000-0000-4000-a000-000000000001', 'admin@fachapp.local', 'admin', 'Equipo FachApp', 'M', 'Cuenta oficial del equipo de FachApp.', true),
  ('00000000-0000-4000-a000-000000000002', 'lucia@fachapp.local', 'lucia_sev', 'Lucía Romero', 'SE', 'Fotografía, tapas y atardeceres en Triana 🌅', false),
  ('00000000-0000-4000-a000-000000000003', 'pablo@fachapp.local', 'pablo_bcn', 'Pablo Martí', 'B', 'Corredor de fondo. Siempre con una misión pendiente.', false),
  ('00000000-0000-4000-a000-000000000004', 'marta@fachapp.local', 'marta_vlc', 'Marta Gil', 'V', 'Voluntaria y amante del mar.', false),
  ('00000000-0000-4000-a000-000000000005', 'javi@fachapp.local', 'javi_bilbo', 'Javi Etxeberria', 'BI', 'Monte, pintxos y fútbol.', false),
  ('00000000-0000-4000-a000-000000000006', 'sara@fachapp.local', 'sara_mad', 'Sara López', 'M', 'Madrileña de adopción. Coleccionando insignias.', false),
  ('00000000-0000-4000-a000-000000000007', 'dani@fachapp.local', 'dani_zgz', 'Dani Pardo', 'Z', 'Nuevo por aquí 👋', false),
  ('00000000-0000-4000-a000-000000000008', 'usuario@fachapp.local', 'usuario_demo', 'Usuario Demo', 'M', 'Cuenta normal de pruebas.', false);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000', d.id, 'authenticated', 'authenticated', d.email,
  extensions.crypt('fachapp123', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', d.display_name),
  now() - interval '30 days', now(), '', '', '', ''
from demo_users d;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), d.id, d.id::text,
       jsonb_build_object('sub', d.id::text, 'email', d.email, 'email_verified', true),
       'email', now(), now(), now()
from demo_users d;

-- El trigger on_auth_user_created ya creó los perfiles: los completamos.
update public.profiles p
   set username = d.username,
       display_name = d.display_name,
       provincia = d.provincia,
       bio = d.bio,
       is_admin = d.is_admin,
       onboarded = true,
       avatar_url = 'https://i.pravatar.cc/300?u=' || d.username,
       created_at = now() - interval '30 days'
  from demo_users d
 where p.id = d.id;

insert into public.profile_private (user_id, birthdate)
select id, date '1995-05-15' from demo_users;

-- ---------------------------------------------------------------------------
-- Misiones (todas con temática española)
-- ---------------------------------------------------------------------------
-- @missions:start (generado por scripts/missions.mjs, no editar a mano)
insert into public.missions (id, title, description, category, difficulty, points, verification_type, rules, starts_at, ends_at, cover_image, featured, created_by) values
  ('10000000-0000-4000-a000-000000000025', 'Foto con la bandera de España', 'Hazte una foto con la rojigualda: en tu balcón, en un acto, en el pueblo o donde ondee con más arte. Puntos extra de orgullo si es grande (los puntos de verdad son los de la misión).', 'españa', 'facil', 80, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-bandera/800/450', true, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000023', '#España en X', 'Publica un post en X con el hashtag #España contando qué te gusta de tu tierra. Lo verificamos automáticamente.', 'redes', 'facil', 50, 'x_auto', '{"type":"post_with_hashtag","hashtag":"#España","min_count":1,"window_days":7}', null, null, 'https://picsum.photos/seed/fachapp-espana-x/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000001', 'Estrena el #FachApp', 'Publica un post en X con el hashtag #FachApp contando qué reto español vas a completar esta semana.', 'redes', 'facil', 50, 'x_auto', '{"type":"post_with_hashtag","hashtag":"#FachApp","min_count":1,"window_days":7}', null, null, 'https://picsum.photos/seed/fachapp-hashtag/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000030', '#12deOctubre en X', 'Felicita la Fiesta Nacional en X con el hashtag #12deOctubre.', 'redes', 'facil', 60, 'x_auto', '{"type":"post_with_hashtag","hashtag":"#12deOctubre","min_count":1,"window_days":7}', '2026-10-05 00:00+02', '2026-10-19 23:59+02', 'https://picsum.photos/seed/fachapp-12-octubre-x/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000002', '100 patriotas', 'Llega a 100 seguidores en tu cuenta de X.', 'redes', 'media', 150, 'x_auto', '{"type":"followers_min","value":100}', null, null, 'https://picsum.photos/seed/fachapp-comunidad/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000003', 'Embajador de España en X', 'Publica al menos 5 posts en X en los últimos 7 días hablando de lo nuestro.', 'redes', 'media', 100, 'x_auto', '{"type":"post_count","min":5,"window_days":7}', null, null, 'https://picsum.photos/seed/fachapp-activa/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000017', 'Selfie con alguien del PP', 'Hazte un selfie con un cargo o personaje conocido del Partido Popular: en un mitin, un acto público o por la calle. Siempre pidiendo permiso y con buen rollo.', 'actualidad', 'dificil', 200, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-selfie-pp/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000013', 'Desfile del 12 de Octubre', 'Fiesta Nacional: foto del desfile, de la Patrulla Águila pintando el cielo o de las banderas en los balcones de tu calle.', 'españa', 'media', 100, 'photo', '{}', '2026-10-10 00:00+02', '2026-10-13 23:59+02', 'https://picsum.photos/seed/fachapp-desfile/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000031', 'Día de la Constitución', 'El 6 de diciembre celebramos la Constitución de 1978. Foto con un ejemplar (o en un acto conmemorativo).', 'españa', 'facil', 60, 'photo', '{}', '2026-12-01 00:00+01', '2026-12-08 23:59+01', 'https://picsum.photos/seed/fachapp-constitucion/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000026', 'Con la camiseta de La Roja', 'Foto con la camiseta de la Selección. Si es la de algún Mundial o Eurocopa ganados, ya eres leyenda.', 'españa', 'facil', 60, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-la-roja/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000004', 'Atardecer en España', 'Haz una foto del atardecer desde tu rincón favorito de España.', 'naturaleza', 'facil', 80, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-atardecer/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000010', 'Amanecer en España', 'Madruga y fotografía un amanecer en cualquier punto de España. El café después te lo has ganado.', 'naturaleza', 'dificil', 120, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-amanecer/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000007', 'Monumento de tu provincia', 'Visita un monumento o lugar histórico de tu provincia y hazte una foto allí.', 'cultura', 'media', 100, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-monumento/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000028', 'Patrimonio de la Humanidad', 'España es de los países con más lugares Patrimonio de la Humanidad: la Alhambra, la Mezquita de Córdoba, la Sagrada Familia, Santiago… Foto en uno de ellos.', 'cultura', 'media', 120, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-patrimonio/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000006', 'Una etapa del Camino de Santiago', 'Haz una etapa del Camino (cualquiera vale) y sube una foto con la flecha amarilla o la concha. ¡Buen Camino!', 'cultura', 'dificil', 150, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-camino/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000018', 'El toro de Osborne', 'Busca uno de los toros de Osborne que vigilan nuestras carreteras y hazte una foto con él (sin ponerte en peligro en el arcén).', 'españa', 'media', 90, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-toro-osborne/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000009', 'Limpia una playa o un monte de España', 'Cuidar lo nuestro también es patriotismo: recoge basura en una playa, río o monte y sube una foto de lo que recogiste.', 'naturaleza', 'media', 150, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-limpieza/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000011', 'Tortilla: ¿con o sin cebolla?', 'El debate que divide España. Sube tu tortilla de patatas y declara tu bando con #ConCebolla o #SinCebolla. Las de bote no cuentan.', 'gastronomía', 'facil', 70, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-tortilla/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000019', 'Paella como Dios manda', 'Paella valenciana de verdad: sin chorizo y con socarrat. Si lleva chorizo, la comunidad votará en consecuencia.', 'gastronomía', 'media', 90, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-paella/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000027', 'Jamón, jamón', 'Foto de un buen plato de jamón ibérico (si lo cortas tú a cuchillo, mejor).', 'gastronomía', 'facil', 60, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-jamon/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000012', 'Las croquetas de la abuela', 'Foto de las mejores croquetas que conozcas. Si son de tu abuela, puntos extra de ternura.', 'gastronomía', 'facil', 60, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-croquetas/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000005', 'Tapeo con amigos', 'Sal de tapas con tus amigos y sube una foto de la mesa (sin caras si no quieren salir).', 'gastronomía', 'facil', 60, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-tapas/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000020', 'Oro líquido', 'España es la primera productora de aceite de oliva del mundo. Foto de tu AOVE español favorito o de una almazara.', 'gastronomía', 'media', 70, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-aceite/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000029', 'Fiestas de tu pueblo', 'Verbena, procesión, peñas o charanga: foto de las fiestas patronales de tu pueblo o barrio.', 'tradiciones', 'facil', 70, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-fiestas/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000014', 'Castañas asadas', 'Llega el otoño: cucurucho de castañas del puesto de la castañera. Foto antes de que se enfríen.', 'tradiciones', 'facil', 50, 'photo', '{}', null, '2026-12-15 23:59+01', 'https://picsum.photos/seed/fachapp-castanas/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000015', 'Huesos de santo y buñuelos', 'Todos los Santos se celebra comiendo. Foto de tus huesos de santo o buñuelos de viento.', 'tradiciones', 'facil', 60, 'photo', '{}', '2026-10-25 00:00+02', '2026-11-03 23:59+01', 'https://picsum.photos/seed/fachapp-bunuelos/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000024', 'El décimo de Navidad', 'Empieza la temporada de lotería. Foto de tu décimo (¡tapa los números de serie!) y comparte el número que te da buena espina.', 'tradiciones', 'facil', 50, 'photo', '{}', '2026-11-15 00:00+01', '2026-12-22 14:00+01', 'https://picsum.photos/seed/fachapp-loteria/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000016', 'Mascota rojigualda', 'Tu perro o tu gato con los colores de España: pañuelo, collar o lo que se deje poner (sin que sufra).', 'tradiciones', 'facil', 60, 'photo', '{}', null, null, 'https://picsum.photos/seed/fachapp-mascota/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000021', 'Frase de cuñado', 'Cuéntanos la frase más cuñada que hayas oído en la sobremesa ("esto en mi pueblo es gratis", "yo eso lo arreglo en un momento"…). Sin nombres: el cuñado es un concepto.', 'humor', 'facil', 40, 'manual', '{}', null, null, 'https://picsum.photos/seed/fachapp-cunado/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000022', 'Siesta de pijama y orinal', 'Patrimonio inmaterial: cuéntanos tu siesta épica (duración, lugar y si hubo babas). La comunidad decide si es digna.', 'humor', 'facil', 40, 'manual', '{}', null, null, 'https://picsum.photos/seed/fachapp-siesta/800/450', false, '00000000-0000-4000-a000-000000000001'),
  ('10000000-0000-4000-a000-000000000008', 'Una mañana por tu gente', 'Dedica una mañana a una ONG, banco de alimentos o parroquia de tu ciudad. Cuéntanos dónde fuiste y la comunidad lo validará.', 'solidaridad', 'dificil', 200, 'manual', '{}', null, null, 'https://picsum.photos/seed/fachapp-voluntariado/800/450', false, '00000000-0000-4000-a000-000000000001');
-- @missions:end

-- ---------------------------------------------------------------------------
-- Seguidores
-- ---------------------------------------------------------------------------
insert into public.follows (follower_id, following_id) values
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000003'),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000004'),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000006'),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000002'),
  ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-a000-000000000005'),
  ('00000000-0000-4000-a000-000000000004', '00000000-0000-4000-a000-000000000002'),
  ('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-a000-000000000002'),
  ('00000000-0000-4000-a000-000000000005', '00000000-0000-4000-a000-000000000003'),
  ('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000002'),
  ('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000003'),
  ('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000004'),
  ('00000000-0000-4000-a000-000000000006', '00000000-0000-4000-a000-000000000005'),
  ('00000000-0000-4000-a000-000000000007', '00000000-0000-4000-a000-000000000006'),
  ('00000000-0000-4000-a000-000000000008', '00000000-0000-4000-a000-000000000002'),
  ('00000000-0000-4000-a000-000000000008', '00000000-0000-4000-a000-000000000006'),
  ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000008');

-- ---------------------------------------------------------------------------
-- Misiones completadas (el trigger crea el post, la notificación y las insignias)
-- ---------------------------------------------------------------------------
insert into public.mission_attempts (user_id, mission_id, status, photo_url, note, verified_at, evidence) values
  ('00000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000004', 'verified', 'https://picsum.photos/seed/lucia-atardecer/900/900', 'Atardecer desde el puente de Triana. No me canso nunca 🧡', now() - interval '6 days', '{}'),
  ('00000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000005', 'verified', 'https://picsum.photos/seed/lucia-tapas/900/900', 'Tapeo en la Alameda con las de siempre.', now() - interval '3 days', '{}'),
  ('00000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000007', 'verified', 'https://picsum.photos/seed/lucia-giralda/900/900', 'La Giralda, clásico pero infalible.', now() - interval '1 day', '{}'),
  ('00000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000001', 'verified', null, null, now() - interval '2 days', '{"mock": true, "matched": 2}'),
  ('00000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000006', 'verified', 'https://picsum.photos/seed/pablo-ruta/900/900', 'Etapa de Sarria a Portomarín. Las piernas dicen basta. #CaminoDeSantiago', now() - interval '5 days', '{}'),
  ('00000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000004', 'verified', 'https://picsum.photos/seed/pablo-atardecer/900/900', 'Desde los búnkers del Carmel.', now() - interval '20 days', '{}'),
  ('00000000-0000-4000-a000-000000000004', '10000000-0000-4000-a000-000000000009', 'verified', 'https://picsum.photos/seed/marta-playa/900/900', 'Tres bolsas en la Malvarrosa. ¡Sumaos el sábado!', now() - interval '2 days', '{}'),
  ('00000000-0000-4000-a000-000000000004', '10000000-0000-4000-a000-000000000008', 'verified', null, 'Mañana en el banco de alimentos de Valencia.', now() - interval '12 days', '{}'),
  ('00000000-0000-4000-a000-000000000005', '10000000-0000-4000-a000-000000000007', 'verified', 'https://picsum.photos/seed/javi-guggen/900/900', 'El Guggen con sol, que no es poco.', now() - interval '4 days', '{}'),
  ('00000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000005', 'verified', 'https://picsum.photos/seed/sara-tapas/900/900', 'Bravas en La Latina.', now() - interval '8 hours', '{}'),
  ('00000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000004', 'verified', 'https://picsum.photos/seed/sara-templo/900/900', 'Templo de Debod, como manda la tradición.', now() - interval '9 days', '{}'),
  ('00000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000006', 'verified', 'https://picsum.photos/seed/sara-retiro/900/900', '¡Llegué a la Plaza del Obradoiro! Ultreia 🐚 #CaminoDeSantiago', now() - interval '2 days', '{}'),
  ('00000000-0000-4000-a000-000000000008', '10000000-0000-4000-a000-000000000005', 'verified', 'https://picsum.photos/seed/usuario-tapas/900/900', 'Primera misión completada: tapas en Malasaña.', now() - interval '1 day', '{}');

-- Retos con humor ya completados
insert into public.mission_attempts (user_id, mission_id, status, photo_url, note, verified_at, evidence) values
  ('00000000-0000-4000-a000-000000000005', '10000000-0000-4000-a000-000000000011', 'verified', 'https://picsum.photos/seed/javi-tortilla/900/900', 'Pintxo de tortilla en lo Viejo. #ConCebolla y sin debate. 🧅', now() - interval '20 hours', '{}'),
  ('00000000-0000-4000-a000-000000000004', '10000000-0000-4000-a000-000000000011', 'verified', 'https://picsum.photos/seed/marta-tortilla/900/900', 'Lo siento, Javi. #SinCebolla para siempre.', now() - interval '18 hours', '{}'),
  ('00000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000012', 'verified', 'https://picsum.photos/seed/lucia-croquetas/900/900', 'Las de mi abuela Carmen. No acepto discusión. #Croquetas', now() - interval '10 hours', '{}'),
  ('00000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000016', 'verified', 'https://picsum.photos/seed/sara-gato/900/900', 'Mi gato con su pañuelo rojigualda. Cara de pocos amigos, pero patriota. #España', now() - interval '5 hours', '{}'),
  ('00000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000019', 'verified', 'https://picsum.photos/seed/pablo-tupper/900/900', 'Paella de mi madre en Sueca. Sin chorizo, tranquilos. #Paella', now() - interval '3 hours', '{}');

-- Más retos españoles completados
insert into public.mission_attempts (user_id, mission_id, status, photo_url, note, verified_at, evidence) values
  ('00000000-0000-4000-a000-000000000002', '10000000-0000-4000-a000-000000000025', 'verified', 'https://picsum.photos/seed/lucia-bandera/900/900', 'La bandera del balcón de casa, recién lavada para el 12 de octubre. #España', now() - interval '6 hours', '{}'),
  ('00000000-0000-4000-a000-000000000005', '10000000-0000-4000-a000-000000000026', 'verified', 'https://picsum.photos/seed/javi-laroja/900/900', 'Con la camiseta de la Euro 2024. Todavía me emociono. #LaRoja', now() - interval '2 days', '{}'),
  ('00000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000028', 'verified', 'https://picsum.photos/seed/pablo-sagrada/900/900', 'La Sagrada Familia, ya casi terminada. Casi. #Barcelona', now() - interval '4 days', '{}');

-- Pendientes de validar: las vota la comunidad (5 a favor = superado, 10 en contra = fallido) o un admin
insert into public.mission_attempts (user_id, mission_id, status, photo_url, note) values
  ('00000000-0000-4000-a000-000000000007', '10000000-0000-4000-a000-000000000004', 'pending', 'https://picsum.photos/seed/dani-atardecer/900/900', 'Mi primer atardecer en el Ebro.'),
  ('00000000-0000-4000-a000-000000000005', '10000000-0000-4000-a000-000000000009', 'pending', 'https://picsum.photos/seed/javi-monte/900/900', 'Limpieza en el Pagasarri.'),
  ('00000000-0000-4000-a000-000000000006', '10000000-0000-4000-a000-000000000017', 'pending', 'https://picsum.photos/seed/sara-selfie/900/900', 'Selfie en el mitin del domingo en Madrid. ¡Muy majos todos!'),
  ('00000000-0000-4000-a000-000000000003', '10000000-0000-4000-a000-000000000025', 'pending', 'https://picsum.photos/seed/pablo-bandera/900/900', 'Bandera gigante en la plaza del pueblo de mis abuelos.');

-- Algunos votos ya emitidos (se ven como progreso)
insert into public.attempt_votes (attempt_id, voter_id, approve)
select a.id, v.voter, v.ok
from public.mission_attempts a
join (values
  ('00000000-0000-4000-a000-000000000007'::uuid, '00000000-0000-4000-a000-000000000002'::uuid, true),
  ('00000000-0000-4000-a000-000000000007'::uuid, '00000000-0000-4000-a000-000000000003'::uuid, true),
  ('00000000-0000-4000-a000-000000000007'::uuid, '00000000-0000-4000-a000-000000000004'::uuid, true),
  ('00000000-0000-4000-a000-000000000006'::uuid, '00000000-0000-4000-a000-000000000002'::uuid, true),
  ('00000000-0000-4000-a000-000000000006'::uuid, '00000000-0000-4000-a000-000000000005'::uuid, false)
) as v(author, voter, ok) on v.author = a.user_id
where a.status = 'pending' and a.mission_id in ('10000000-0000-4000-a000-000000000004', '10000000-0000-4000-a000-000000000017');

-- Fecha de los posts = fecha de verificación
update public.posts p set created_at = a.verified_at
  from public.mission_attempts a where a.id = p.mission_attempt_id;

-- Un post libre
insert into public.posts (user_id, text, images, created_at) values
  ('00000000-0000-4000-a000-000000000001', '¡Bienvenidos a FachApp! Completad misiones, seguid a vuestros amigos y subid en el ranking. Recordad respetar las normas de la comunidad. 💪', '{}', now() - interval '15 days');

-- Publicaciones libres con varias fotos y hashtags (galería y Explorar)
insert into public.posts (user_id, text, images, created_at) values
  ('00000000-0000-4000-a000-000000000002', 'Domingo de paseo por Triana. Octubre y aún en manga corta 🥵 #España #Sevilla',
   array['https://picsum.photos/seed/triana-1/900/900', 'https://picsum.photos/seed/triana-2/900/900', 'https://picsum.photos/seed/triana-3/900/900'], now() - interval '2 days 3 hours'),
  ('00000000-0000-4000-a000-000000000003', 'Entreno de hoy en la Barceloneta. Las piernas ya no son mías. #Running #Barcelona',
   array['https://picsum.photos/seed/barceloneta-1/900/900', 'https://picsum.photos/seed/barceloneta-2/900/900'], now() - interval '1 day 6 hours'),
  ('00000000-0000-4000-a000-000000000006', '¿Soy la única que ya ha sacado la manta? #Otoño #Madrid',
   array['https://picsum.photos/seed/sara-manta/900/900'], now() - interval '9 hours'),
  ('00000000-0000-4000-a000-000000000005', 'Ruta al Gorbea con niebla de película. Volveré cuando se vea algo 😅 #Monte #Bizkaia',
   array['https://picsum.photos/seed/gorbea-1/900/900', 'https://picsum.photos/seed/gorbea-2/900/900', 'https://picsum.photos/seed/gorbea-3/900/900', 'https://picsum.photos/seed/gorbea-4/900/900'], now() - interval '7 hours'),
  ('00000000-0000-4000-a000-000000000004', 'Atardecer en la Albufera. Sin filtro, lo prometo. #España #Valencia',
   array['https://picsum.photos/seed/albufera-1/900/900', 'https://picsum.photos/seed/albufera-2/900/900'], now() - interval '4 hours'),
  ('00000000-0000-4000-a000-000000000007', 'Primera semana en FachApp. ¿Alguien de Zaragoza para el reto de las #Croquetas? 🙋',
   '{}', now() - interval '2 hours'),
  ('00000000-0000-4000-a000-000000000008', 'Probando FachApp: mi primer post con foto. #Croquetas #Madrid',
   array['https://picsum.photos/seed/usuario-primer-post/900/900'], now() - interval '1 hour');

-- ---------------------------------------------------------------------------
-- Likes y comentarios
-- ---------------------------------------------------------------------------
insert into public.likes (user_id, post_id)
select u.id, p.id
from public.posts p
cross join (values
  ('00000000-0000-4000-a000-000000000002'::uuid), ('00000000-0000-4000-a000-000000000003'::uuid),
  ('00000000-0000-4000-a000-000000000004'::uuid), ('00000000-0000-4000-a000-000000000006'::uuid),
  ('00000000-0000-4000-a000-000000000005'::uuid), ('00000000-0000-4000-a000-000000000007'::uuid)
) as u(id)
where p.user_id <> u.id and (hashtext(p.id::text || u.id::text) % 3) <> 0;

-- Comentarios en el debate de la tortilla (el gran clásico)
insert into public.comments (post_id, user_id, text, created_at)
select p.id, c.user_id, c.text, p.created_at + c.delay
from public.posts p
join public.mission_attempts a on a.id = p.mission_attempt_id
join (values
  ('00000000-0000-4000-a000-000000000005'::uuid, '00000000-0000-4000-a000-000000000004'::uuid, 'Una tortilla sin cebolla es un bocadillo de huevo con ilusiones. 🧅', interval '30 minutes'),
  ('00000000-0000-4000-a000-000000000004'::uuid, '00000000-0000-4000-a000-000000000005'::uuid, 'Pues que sepas que mi abuela tampoco le ponía. Respeto.', interval '1 hour'),
  ('00000000-0000-4000-a000-000000000004'::uuid, '00000000-0000-4000-a000-000000000002'::uuid, '#ConCebolla hasta el final, lo siento Marta 😂', interval '2 hours')
) as c(author_id, user_id, text, delay) on c.author_id = p.user_id
where a.mission_id = '10000000-0000-4000-a000-000000000011';

insert into public.comments (post_id, user_id, text, created_at)
select p.id, c.user_id, c.text, p.created_at + interval '2 hours'
from public.posts p
join public.mission_attempts a on a.id = p.mission_attempt_id
join (values
  ('10000000-0000-4000-a000-000000000004'::uuid, '00000000-0000-4000-a000-000000000006'::uuid, '¡Qué colores! 😍'),
  ('10000000-0000-4000-a000-000000000005'::uuid, '00000000-0000-4000-a000-000000000003'::uuid, 'Esa mesa pinta muy bien.'),
  ('10000000-0000-4000-a000-000000000006'::uuid, '00000000-0000-4000-a000-000000000002'::uuid, '¡Máquina! A por los 20 km.'),
  ('10000000-0000-4000-a000-000000000009'::uuid, '00000000-0000-4000-a000-000000000006'::uuid, 'Gracias por hacerlo, Marta 👏')
) as c(mission_id, user_id, text) on c.mission_id = a.mission_id
where p.user_id <> c.user_id;
drop table demo_users;

# Plan de desarrollo de FachApp

Cada fase termina con: compila, `lint` sin errores, tests en verde y README actualizado.

| Fase                     | Estado                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------ |
| 0 — Setup                | ✅                                                                                   |
| 1 — Auth y perfiles      | ✅                                                                                   |
| 2 — Misiones sin X       | ✅                                                                                   |
| 3 — Integración X        | ✅ (probada en modo mock; falta la app real de developer.x.com)                      |
| 4 — Red social           | ✅                                                                                   |
| 5 — Gamificación         | ✅                                                                                   |
| 6 — Calidad y despliegue | ✅ (falta activar Pages y los secrets: ver README)                                   |
| 7 — Móvil (Capacitor)    | ✅ APK Android compilado; falta Firebase, firma para Google Play y build iOS (macOS) |

Verificación (1 oct 2026): 72 tests unitarios, 5 Edge Functions sin errores de tipos (`deno check`), APK Android compilado, 13 E2E (Playwright) incluidos accesibilidad WCAG AA con axe, Lighthouse móvil **94 / 96 / 100 / 100** (rendimiento / accesibilidad / buenas prácticas / SEO).

---

## Fase 0 — Setup ✅

Monorepo npm workspaces, Vite + React 19 + TS estricto, Tailwind v4 + shadcn/ui, ESLint + Prettier + Husky, Vitest, `supabase/`, CI.

## Fase 1 — Auth y perfiles ✅

- Migración `…0100_profiles`: `provincias` (52 + Ceuta y Melilla), `profiles` (público), `profile_private` (fecha de nacimiento y consentimientos, solo el dueño), trigger de alta, protección de columnas (`is_admin`, `x_connected`…), RPC `complete_onboarding` (valida **≥ 14 años** en servidor) y `username_available`, bucket `avatars`.
- Pantallas: bienvenida (3 pasos), entrar (contraseña, enlace mágico, Google, X), registro, recuperar/nueva contraseña, onboarding, perfil propio/ajeno, editar perfil con avatar (recorte + WebP), páginas legales.
- Guardas `RequireAuth` / `RequireOnboarded` / `RequireAdmin` / `RedirectIfAuthed`.

## Fase 2 — Misiones sin X ✅

- Migración `…0200_missions`: `missions`, `mission_attempts` (único por usuario+misión), RPC `submit_attempt` y `review_attempt`, buckets `proofs` (privado, URLs firmadas) y `covers`.
- Listado con búsqueda y filtros (estado, categoría, dificultad, verificación), detalle con progreso, subida (cámara/galería → recorte → WebP), panel admin (validar pruebas, CRUD de misiones con editor de reglas validado).
- Seed: 10 misiones (3 `x_auto`, 6 `photo`, 1 `manual`), 7 usuarios demo con actividad.

## Fase 3 — Integración X ✅

- Migración `…0300_x_integration`: `x_accounts` (tokens cifrados), `x_oauth_states`, `x_api_calls` (caché + límite). Sin privilegios para `anon`/`authenticated`.
- Edge Functions: `x-oauth-start` (exige consentimiento, PKCE), `x-oauth-callback`, `x-verify` (caché 15 min, límite diario configurable, refresco de token), `x-disconnect` (revoca y borra).
- `_shared/rules.ts`: evaluador puro de `post_with_hashtag`, `followers_min`, `post_count` con tests; lo reutiliza el frontend para describir y validar reglas.
- Modo mock determinista (`X_MOCK=true`).

## Fase 4 — Red social ✅

- Migración `…0400_social`: `posts`, `follows`, `likes`, `comments`, `blocks`, `reports`, `notifications`, `banned_words` + triggers de filtro ofensivo, post automático al completar misión, notificaciones (follow, like, comentario, misión validada/rechazada), Realtime, vista `post_feed` y RPC `get_feed` paginado.
- Feed Siguiendo/Descubrir con scroll infinito, likes optimistas, comentarios, búsqueda (pg_trgm), seguidores/seguidos, reportar, bloquear, notificaciones en tiempo real con contador.

## Fase 5 — Gamificación ✅

- Migración `…0500_gamification`: niveles (`level_for_points`), `badges` + `user_badges` (8 insignias otorgadas por triggers), vista `leaderboard`, RPC `get_leaderboard` (global, semanal lunes-domingo en hora de Madrid, amigos, provincia) y `get_profile_stats`.
- Perfil con nivel y progreso, insignias SVG propias, cuadrícula de fotos y misiones completadas; ranking con podio y posición propia fija.

## Fase 6 — Calidad y despliegue ✅

- Migración `…0600_account`: `export_my_data()` y `delete_my_account()`.
- Ajustes: cuenta, cambiar contraseña, X, tema, bloqueados, exportar datos, borrar cuenta.
- Playwright: auth, misiones con foto + validación de admin, misión X mock, social, RGPD, accesibilidad (axe) y capturas (`docs/capturas`).
- Code splitting por ruta, iconos PWA PNG/maskable, Lighthouse > 90.
- `ci.yml` (formato, lint, tests, build y E2E con Supabase en Docker) y `deploy.yml` (GitHub Pages).

## Fase 7 — Móvil ✅

Hecho:

- `capacitor.config.ts`, proyectos `android/` e `ios/`, build nativo con rutas relativas (`--mode native`).
- Cámara nativa (`@capacitor/camera`) en el selector de fotos, permisos de cámara/galería/notificaciones.
- OAuth nativo: navegador del sistema + deep link `es.fachapp.app://auth`.
- Registro de dispositivo para push → tabla `push_tokens` (migración `…0700`).
- Iconos y splash generados con `@capacitor/assets`.
- Push completo: migración `…0800_push_dispatch` (trigger + pg_net + Vault) → Edge Function `send-push` (FCM HTTP v1, borra tokens caducados, modo mock sin Firebase). Al tocar la notificación se abre la pantalla correspondiente.
- APK de depuración compilado en Docker (`npm run android:apk -w @fachapp/web`, JDK 21 + Android SDK 36).

Pendiente (requiere cuentas o un Mac):

- Firebase: `google-services.json` y secreto `FCM_SERVICE_ACCOUNT` (y clave APNs para iOS).
- Firmar el AAB para Google Play (keystore) y compilar iOS en macOS con Xcode.

## Extra — Más red social y humor ✅

- Migración `…0900_social_plus`: `missions.featured` (Reto de la semana), `posts.hashtags` (columna generada + índice GIN), RPC `get_posts_by_tag`, `get_trending_posts`, `get_trending_hashtags`, 4 insignias sociales (Paparazzi, Influencer de barrio, Tertuliano, Croquetero).
- 14 retos con humor y de temporada (otoño 2026) en `seed.sql` y `seed-production.sql`.
- Publicaciones con hasta 4 fotos (carrusel), doble toque = me gusta, visor a pantalla completa, galería por perfil, #hashtags y @menciones enlazados, pantalla Explorar y página por hashtag.
- Cuentas demo `usuario@` / `admin@fachapp.local` con botones de acceso rápido (solo local) y pestaña Usuarios en el panel de admin.

## Extra — España, validación comunitaria y premios ✅

- Todas las misiones con temática española (31), generadas desde `scripts/missions-data.mjs` para `seed.sql` y `seed-production.sql`. Reto de la semana: foto con la bandera.
- Migración `…1000_community_validation`: `attempt_votes`, `vote_attempt()` (5 a favor → superado, 10 en contra → fallido), `get_attempts_to_validate()` (al azar, sin las propias ni bloqueados), recuentos públicos, insignia Árbitro. Pantalla **Validar retos**.
- Migración `…1100_rewards`: catálogo de premios (temas, marcos, títulos, insignias), saldo canjeable independiente del ranking, `buy_reward()` y `equip_reward()`. Pantalla **Premios**.
- Admins: botón "Nuevo reto" en Misiones y subida de foto de portada.
- Tests: 86 unitarios y 25 E2E (incluye votación de 5 usuarios, premios y creación de retos).

---

## Decisiones tomadas (revisables)

- **npm workspaces** (pnpm no está instalado en el equipo).
- **Supabase local con Docker** (`supabase/docker` + `scripts/sb.mjs`) porque el antivirus bloquea el CLI. Las migraciones son compatibles con `supabase db push`.
- **Puerto 5180** para no chocar con otros proyectos Vite.
- **X para login y para misiones**, pero la lectura para misiones pide **consentimiento aparte** y se puede desconectar sin perder la cuenta.
- **Perfiles públicos** (sin cuentas privadas). La privacidad se controla con bloqueos y no mostrando la fecha de nacimiento.
- **Límite de X**: 10 verificaciones reales por usuario y día + caché de 15 min (`X_DAILY_LIMIT`).
- **Ranking por provincia** (la tabla `provincias` ya guarda la comunidad autónoma si se quiere añadir).
- Misiones `x_auto` no cumplidas se guardan como `rejected` con el progreso; se pueden reintentar.
- Textos legales provisionales: revisar con un profesional.

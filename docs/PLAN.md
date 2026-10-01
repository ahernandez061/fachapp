# Plan de desarrollo de FachApp

Cada fase termina con: compila, `lint` sin errores, tests en verde y README actualizado.
No se empieza una fase sin confirmación.

| Fase                     | Estado                    |
| ------------------------ | ------------------------- |
| 0 — Setup                | ✅ Hecha                  |
| 1 — Auth y perfiles      | ⏳ Pendiente de confirmar |
| 2 — Misiones sin X       | —                         |
| 3 — Integración X        | —                         |
| 4 — Red social           | —                         |
| 5 — Gamificación         | —                         |
| 6 — Calidad y despliegue | —                         |
| 7 — Móvil (Capacitor)    | —                         |

---

## Fase 0 — Setup ✅

- Monorepo con **npm workspaces** (`apps/web`), Node 22.
- Vite + React 19 + TypeScript estricto, alias `@/`.
- Tailwind CSS v4 + shadcn/ui (`components.json`, estilo _new-york_, base _stone_, primario rojo-anaranjado), modo claro/oscuro/sistema con Zustand.
- React Router con `createHashRouter`, layout mobile-first con barra inferior (Feed · Misiones · Subir · Ranking · Perfil) y páginas vacías con estados vacíos.
- TanStack Query, cliente Supabase (PKCE), utilidades `es-ES` / `Europe/Madrid`.
- vite-plugin-pwa (manifest + service worker), `base: '/fachapp/'`.
- ESLint (flat config) + Prettier (+ plugin Tailwind) + Husky + lint-staged.
- Vitest + Testing Library (tests de i18n, tema y navegación).
- `supabase/` (config, migrations, functions, seed) y workflow `ci.yml`.

## Fase 1 — Auth y perfiles

**BD (migración `0001_profiles.sql`)**

- Tabla `profiles` (id → `auth.users`, `username` único con check `^[a-z0-9_]{3,20}$`, `display_name`, `avatar_url`, `bio` ≤ 160, `provincia` (enum/check con las 52 provincias + Ceuta/Melilla), `birthdate`, `x_connected`, `is_admin`, `created_at`).
- Trigger `on_auth_user_created` que crea el perfil vacío.
- RLS: lectura pública de perfiles; `update` solo el propio usuario; `is_admin` no editable por el usuario.
- Bucket `avatars` con políticas (cada usuario solo escribe en su carpeta `uid/`).
- `supabase gen types` → `src/lib/database.types.ts` y cliente tipado.

**Frontend**

- Pantallas: bienvenida/onboarding (3 slides), login, registro, recuperar contraseña.
- Login con email+contraseña, magic link, **Google** y **X (OAuth 2.0)** vía Supabase Auth.
- Formulario "Completa tu perfil" (react-hook-form + zod): username (comprobación de disponibilidad), nombre, provincia, fecha de nacimiento → **bloqueo < 14 años** (LOPDGDD), aceptación de normas y privacidad.
- Store de sesión (Zustand) + `RequireAuth` / `RequireProfile` para proteger rutas.
- Página de perfil propio y ajeno (`/u/:username`), editar perfil, subir avatar (compresión + WebP).
- Páginas legales: privacidad, términos, normas de comunidad.

**Tests**: esquemas zod (edad, username), guardas de rutas, formulario de perfil.

## Fase 2 — Misiones sin X

**BD**: `missions`, `mission_attempts` (único por usuario+misión activa), enums `verification_type` y `attempt_status`; bucket `proofs` (privado, URLs firmadas). RLS: misiones activas legibles por todos; intentos legibles por su dueño y admins; solo admins validan. Función `submit_photo_attempt`. Seed con **10 misiones** (mezcla de `photo`, `manual` y `x_auto`) con portadas de Picsum.

**Frontend**

- Listado de misiones con filtros (categoría, dificultad, tipo, estado) y skeletons.
- Detalle con progreso, reglas en lenguaje natural, fechas, botón "Subir foto" / "Verificar".
- Flujo de subida: cámara o galería, recorte (`react-easy-crop`), compresión `browser-image-compression` → WebP, texto opcional.
- **Panel admin** (`/admin`, solo `is_admin`): CRUD de misiones (editor de `rules` JSON validado con zod), cola de fotos pendientes (aprobar/rechazar con motivo).

**Tests**: esquema de `rules`, componente de filtros, utilidades de imagen (mock).

## Fase 3 — Integración X

- Conexión de X **separada del login** con pantalla de **consentimiento RGPD** (qué datos se leen, para qué, cómo revocar). Scopes mínimos: `tweet.read users.read offline.access`.
- Edge Functions (Deno):
  - `x-oauth-start` → genera `state` + PKCE y devuelve la URL de autorización.
  - `x-oauth-callback` → intercambia el código, **cifra tokens (AES-GCM)** y guarda en `x_accounts` (RLS sin acceso desde cliente; solo `service_role`).
  - `x-verify` → carga misión + token (refresca si caduca), consulta X API v2, evalúa la regla y actualiza `mission_attempts`.
  - `x-disconnect` → revoca token y borra la fila.
- **Evaluador de reglas** puro y compartido (`supabase/functions/_shared/rules/`): `post_with_hashtag`, `followers_min`, `post_count`; extensible por registro de tipos. Tests unitarios por tipo y casos límite (ventanas temporales en `Europe/Madrid`).
- **Caché + rate limit**: tabla `x_api_calls` (máx. N verificaciones/usuario/hora y caché de respuestas 15 min).
- **Modo mock** (`X_MOCK=true` / `VITE_X_MOCK=true`): cliente X falso con fixtures deterministas.

## Fase 4 — Red social

- BD: `posts` (se crea automáticamente al verificar una misión, opcionalmente con texto/fotos), `follows`, `likes`, `comments`, `blocks`, `reports`, `notifications`. Triggers que generan notificaciones (nuevo seguidor, like, comentario, misión validada/rechazada).
- Feed con pestañas **Siguiendo** / **Descubrir**, paginación infinita (`useInfiniteQuery`), likes optimistas, comentarios.
- Búsqueda de usuarios (por username/nombre, índice `pg_trgm`) y seguir/dejar de seguir.
- Notificaciones en tiempo real (Supabase Realtime) con contador en la barra.
- Moderación: reportar post/comentario/usuario, bloquear, **filtro de lenguaje ofensivo** (lista en BD + check en cliente y en trigger), cola de reportes en el panel admin.

## Fase 5 — Gamificación

- Puntos por misión verificada (en BD, no en cliente), **niveles** (curva de puntos) e **insignias** (tabla `badges` + `user_badges`, iconos SVG propios, otorgadas por triggers).
- Vista `leaderboard` + vistas/RPC: global, semanal (semana lunes-domingo en `Europe/Madrid`), amigos y por provincia.
- Pantalla de ranking con pestañas, posición propia fija y perfil con insignias, nivel y cuadrícula de fotos.

## Fase 6 — Calidad y despliegue

- Ajustes: cuenta, desconectar X, privacidad (perfil privado), **exportar datos (JSON)** y **borrar cuenta** (Edge Function `delete-account`).
- Playwright E2E (login mock, completar misión, seguir, ranking) + **capturas** automáticas para `docs/`.
- Accesibilidad WCAG AA (axe en tests), Lighthouse > 90 (PWA, rendimiento, a11y, SEO), iconos PWA PNG.
- `deploy.yml`: push a `main` → lint, test, build con `VITE_SUPABASE_*` desde GitHub Secrets → `actions/deploy-pages`.
- Diagramas Mermaid completos y guía de configuración manual en el README.
- Banner de cookies solo si se añade analítica.

## Fase 7 — Móvil

- Capacitor (Android/iOS) envolviendo `apps/web/dist`, cambiando a `base: './'` en builds nativas.
- Iconos y splash (`@capacitor/assets`), cámara nativa (`@capacitor/camera`), push (`@capacitor/push-notifications` + FCM/APNs), deep links para OAuth.
- Builds de Android (Gradle) e iOS (Xcode) y guía de publicación.

---

## Decisiones tomadas en la Fase 0 (revisables)

- **npm workspaces** en lugar de pnpm (pnpm no está instalado en el equipo; cambiar es trivial).
- **Tailwind v4** (configuración en CSS, sin `tailwind.config.js`), que es lo que usa shadcn/ui actualmente.
- `supabase/config.toml` escrito a mano: el CLI de Supabase vía `npx` falla en este equipo con `spawn EPERM` (probablemente antivirus/política). Ver README.
- Colores provisionales inspirados en la bandera (rojo/amarillo) para el logo y el primario.

## Preguntas abiertas

1. **Nombre "FachApp"**: ¿definitivo? Afecta al logo, al dominio y a la revisión en las tiendas de apps.
2. **Login con X**: ¿quieres X como método de _login_ además de como _conexión_ para misiones, o solo conexión? (Recomiendo ambos, pero la conexión para misiones con su consentimiento propio.)
3. **Perfiles privados**: ¿hay cuentas privadas (seguir requiere aprobación) o todo es público?
4. **Coste de la API de X**: ¿tienes ya plan/créditos en developer.x.com? Define cuántas verificaciones por usuario/día quieres permitir.
5. **Provincias**: ¿52 provincias o también por comunidad autónoma en el ranking?

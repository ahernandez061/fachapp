# Notas de sesión

## 2026-10-01 (final): España, validación comunitaria, premios y push a GitHub

**Hecho**

- 31 misiones con temática española (bandera = Reto de la semana, selfie con alguien del PP, #España y #12deOctubre en X…), con una sola fuente: `scripts/missions-data.mjs` → `node scripts/missions.mjs` regenera `seed.sql` y `seed-production.sql`.
- Validación por la comunidad (`/validar`): 5 votos a favor → superado, 10 en contra → fallido. Umbrales en `community_approvals_needed()` / `community_rejections_needed()`.
- Premios (`/premios`): temas de color, marcos de avatar, títulos e insignias exclusivas canjeables con un saldo aparte del ranking.
- Admins: "Nuevo reto" en Misiones y subida de foto de portada.
- 86 tests unitarios y 25 E2E en verde. Código subido a `git@github.com:ahernandez061/fachapp.git` (con permiso del usuario).

**Próximos pasos**: seguir la sección "Publicar la versión web para probarla con amigos" del README (Supabase en la nube, secrets y GitHub Pages).

## 2026-10-01 (madrugada): red social + humor, cuentas demo y repo conectado

**Hecho**

- Cuentas demo `usuario@fachapp.local` (normal) y `admin@fachapp.local` (admin), contraseña `fachapp123`, con botones de acceso rápido en Entrar/Bienvenida (solo si `VITE_DEMO_ACCOUNTS=true`, que solo está en `.env.local`).
- Panel admin: pestaña Usuarios (dar o quitar admin). Arreglado el desbordamiento horizontal de pestañas y listas en el móvil (`min-w-0` en TabsContent y `grid-cols-1`).
- Migración `…0900_social_plus`: Reto de la semana, hashtags, tendencias y 4 insignias sociales.
- 14 retos con humor y de temporada; publicaciones de ejemplo con varias fotos y hashtags.
- Frontend: carrusel de hasta 4 fotos, doble toque = me gusta, visor a pantalla completa, galería por perfil, #hashtags/@menciones, Explorar (`/explorar`, `/explorar/tag/:tag`).
- Arreglada una carrera al recortar fotos seguidas en `ImagePicker`.
- Scripts `npm run cloud:migrate` y `cloud:functions` (Docker) y `supabase/seed-production.sql` (sin usuarios).
- Remoto `origin` = `git@github.com:ahernandez061/fachapp.git` (público; en GitHub solo hay un commit inicial con un README de una línea).
- 77 tests unitarios y 19 E2E en verde; BD local reiniciada con datos demo limpios.

**Pendiente**: el usuario aún no ha confirmado los commits y el push (hay que integrar con el commit inicial de GitHub). Después: los pasos de "Publicar la versión web" del README (Supabase en la nube, secrets y Pages).

## 2026-10-01 (noche): Fase 7 cerrada (push + APK)

**Hecho**

- Push de punta a punta: migración `…0800_push_dispatch` (trigger `dispatch_push` → pg_net → Vault) y Edge Function `send-push` (FCM HTTP v1; modo mock si falta `FCM_SERVICE_ACCOUNT`). Probado con un token falso: la función recibe y registra el mensaje. Al tocar la notificación en el móvil se abre su pantalla.
- `npm run functions:check`: `deno check` de las 5 Edge Functions en Docker (también en el CI). Sin errores.
- APK de Android compilado en Docker (`npm run android:apk -w @fachapp/web`, imagen `apps/web/android.Dockerfile` con JDK 21 + SDK 36) → `apps/web/android/app/build/outputs/apk/debug/app-debug.apk`.
- 72 tests unitarios y 13 E2E en verde. BD reiniciada a los datos demo.

**Decisión**: el usuario NO quiere commits por ahora. Todo lo posterior a la Fase 0 está sin commitear (en `main` solo están los 5 commits de la Fase 0).

**Próximos pasos**

1. Cuando el usuario lo pida: commits (por fases) y push a GitHub.
2. Configuración manual (README §1-5): GitHub Pages + secrets, Supabase en la nube, Google, app de X, Firebase.
3. Firmar el AAB para Google Play; build iOS en un Mac.
4. Revisar los textos legales.

## 2026-10-01 (tarde): Fases 1-6 implementadas y app levantada

- Supabase local con Docker (`supabase/docker`) + `scripts/sb.mjs`, porque el antivirus bloquea el CLI de Supabase.
- Migraciones `…0100`-`…0700`, seed con 10 misiones y 7 usuarios demo (contraseña `fachapp123`).
- Frontend completo, 4 Edge Functions de X con modo mock, Playwright (con Edge), axe, Lighthouse 94/96/100/100, capturas en `docs/capturas`, `deploy.yml` y `ci.yml`, proyectos Capacitor.
- La app usa el puerto 5180: el 5173 lo ocupa otro proyecto (Horse Training Calendar).

## 2026-10-01: Fase 0 (setup) completada

Monorepo, Vite + React + TS + Tailwind + shadcn, linters, Vitest, CI, `docs/PLAN.md`.

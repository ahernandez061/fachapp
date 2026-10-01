# FachApp

Red social web (PWA) enfocada en España: completa **misiones**, demuéstralo (automáticamente con tu cuenta de **X** o subiendo una **foto**), compártelo con tus amigos y sube en el **ranking**.

> Estado: **Fase 0 (setup) completada**. Ver el plan completo en [`docs/PLAN.md`](docs/PLAN.md) y la arquitectura en [`docs/arquitectura.md`](docs/arquitectura.md).

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · lucide-react · React Router (HashRouter) · TanStack Query · Zustand · react-hook-form + zod · vite-plugin-pwa · Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) · Vitest + Testing Library · Playwright · ESLint + Prettier + Husky · GitHub Actions → GitHub Pages · Capacitor (futuro).

## Estructura

```
fachapp/
├─ apps/web/                 # la app (PWA)
│  ├─ public/                # logo.svg, estáticos
│  └─ src/
│     ├─ features/           # auth, missions, feed, profile, social, ranking, notifications
│     ├─ components/ui/      # componentes shadcn
│     ├─ components/         # layout, estados vacíos, etc.
│     ├─ lib/                # cliente supabase, utils, i18n (es-ES / Europe/Madrid)
│     ├─ stores/             # Zustand (tema, sesión…)
│     └─ routes/             # router (HashRouter)
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/
│  ├─ functions/             # Edge Functions (x-verify, x-oauth-callback…)
│  └─ seed.sql
├─ docs/                     # plan, arquitectura (Mermaid), capturas
└─ .github/workflows/        # CI
```

## Requisitos

- Node 22 (ver `.nvmrc`) y npm 10+.
- (Para backend local) Docker Desktop + [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

## Puesta en marcha

```bash
npm install
cp apps/web/.env.example apps/web/.env.local   # y rellena los valores
npm run dev                                    # http://localhost:5173/fachapp/
```

La app arranca aunque no haya Supabase configurado (verás un aviso en consola); lo necesitarás a partir de la Fase 1.

## Scripts

| Comando                           | Qué hace                                           |
| --------------------------------- | -------------------------------------------------- |
| `npm run dev`                     | Servidor de desarrollo                             |
| `npm run build`                   | Typecheck + build de producción en `apps/web/dist` |
| `npm run preview`                 | Sirve el build                                     |
| `npm run lint`                    | ESLint                                             |
| `npm run test`                    | Tests unitarios (Vitest)                           |
| `npm run format` / `format:check` | Prettier                                           |

Husky ejecuta `lint-staged` (ESLint + Prettier) en cada commit.

## Supabase en local

```bash
# instala el CLI (una de estas):
scoop install supabase          # Windows
brew install supabase/tap/supabase  # macOS
npx supabase --version          # sin instalar

supabase start        # levanta Postgres, Auth, Storage, Studio… (necesita Docker)
supabase db reset     # aplica migrations/ + seed.sql
```

> **Nota Windows**: en este equipo `npx supabase` falla con `spawn EPERM` (el antivirus/política bloquea el binario descargado). Instálalo con `scoop` o descarga el `.exe` desde las releases de GitHub del CLI. Por eso `supabase/config.toml` se ha creado a mano en vez de con `supabase init`.

## Variables de entorno

| Variable                                                             | Dónde                                  | Descripción                             |
| -------------------------------------------------------------------- | -------------------------------------- | --------------------------------------- |
| `VITE_SUPABASE_URL`                                                  | `apps/web/.env.local` y GitHub Secrets | URL del proyecto Supabase               |
| `VITE_SUPABASE_ANON_KEY`                                             | `apps/web/.env.local` y GitHub Secrets | Anon key (pública, protegida por RLS)   |
| `VITE_X_MOCK`                                                        | `apps/web/.env.local`                  | `true` = misiones de X con datos falsos |
| `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_TOKEN_ENCRYPTION_KEY`, `X_MOCK` | `supabase secrets set`                 | Solo Edge Functions (Fase 3)            |

Nunca subas `.env.local` ni secretos: están en `.gitignore`.

## Configuración manual (lo que tienes que hacer tú)

Se irá completando en cada fase. De momento:

1. **Repositorio en GitHub** llamado `fachapp` (la app se servirá en `https://<usuario>.github.io/fachapp/`).
2. **Proyecto en Supabase** (https://supabase.com → New project, región `eu-west` / Frankfurt o París). Copia _Project URL_ y _anon public key_ a `apps/web/.env.local`.

Los pasos de Google OAuth, app de developer.x.com, GitHub Secrets y activar GitHub Pages se documentarán en las fases 1, 3 y 6.

## Legal

Pensada para España/UE: RGPD, edad mínima 14 años (LOPDGDD), consentimiento explícito para conectar X, scopes mínimos de solo lectura y derecho de acceso, exportación y borrado de datos. Ver [`docs/PLAN.md`](docs/PLAN.md).

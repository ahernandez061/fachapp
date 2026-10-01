# Notas de sesión

## 2026-10-01 — Fase 0 (setup) completada

**Hecho**

- Monorepo con npm workspaces (`apps/web`), git inicializado en `main` (sin remoto, sin push).
- Vite 8 + React 19 + TS 6 + Tailwind v4 + shadcn/ui (button, card, skeleton), HashRouter con barra inferior y 5 páginas vacías + 404, tema claro/oscuro/sistema (Zustand), TanStack Query, cliente Supabase, utilidades es-ES/Europe/Madrid, PWA.
- ESLint + Prettier + Husky/lint-staged, Vitest (8 tests), CI `ci.yml`.
- `supabase/` creado a mano (el CLI vía npx da `spawn EPERM` en este PC).
- `docs/PLAN.md` (plan detallado de fases 1-7 + preguntas abiertas) y `docs/arquitectura.md` (Mermaid).

**Estado**: `npm run lint`, `test`, `build`, `format:check` en verde.

**Próximos pasos**

1. Usuario responde a las preguntas abiertas de `docs/PLAN.md` y confirma la **Fase 1 (Auth y perfiles)**.
2. Instalar Supabase CLI (scoop o exe) + Docker para BD local, o crear proyecto en supabase.com.
3. Crear repo `fachapp` en GitHub y añadir remoto.

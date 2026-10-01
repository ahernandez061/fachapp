import { Bell, Compass, Shield, ThumbsUp } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Outlet, useNavigate } from 'react-router'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { useMyProfile } from '@/features/auth/session'
import { useNotificationsRealtime, useUnreadCount } from '@/features/notifications/api'
import { usePendingValidationsCount } from '@/features/validate/api'
import { registerPush } from '@/lib/native'
import { applyRewardTheme } from '@/lib/rewards'
import { resolveDark, useThemeStore } from '@/stores/theme'
import { supabase } from '@/lib/supabase'
import { BottomNav } from './bottom-nav'

export function AppLayout() {
  useNotificationsRealtime()
  const unread = useUnreadCount()
  const { data: toValidate = 0 } = usePendingValidationsCount()
  const { data: me } = useMyProfile()
  const myId = me?.id
  const navigate = useNavigate()
  const mode = useThemeStore((s) => s.theme)
  const rewardTheme = me?.equipped_theme

  // Color de la app canjeado en Premios (se adapta a modo claro/oscuro).
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => applyRewardTheme(rewardTheme, resolveDark(mode, media.matches))
    apply()
    media.addEventListener('change', apply)
    return () => {
      media.removeEventListener('change', apply)
      applyRewardTheme(null, false)
    }
  }, [rewardTheme, mode])

  // App nativa: registra el dispositivo para notificaciones push.
  useEffect(() => {
    if (!myId) return
    registerPush(
      async (token, platform) => {
        await supabase.from('push_tokens').upsert({ token, user_id: myId, platform })
      },
      (link) => navigate(link),
    )
  }, [myId, navigate])

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-background focus:p-2"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur">
        <Link to="/" aria-label="FachApp, inicio">
          <Logo />
        </Link>
        <div className="flex items-center">
          {me?.is_admin && (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin" aria-label="Administración">
                <Shield className="size-5" />
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link
              to="/validar"
              aria-label={toValidate ? `Validar retos (${toValidate} pendientes)` : 'Validar retos'}
            >
              <ThumbsUp className="size-5" />
              {toValidate > 0 && (
                <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-emerald-700 px-1 text-[10px] leading-4 font-bold text-white">
                  {toValidate > 9 ? '9+' : toValidate}
                </span>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/explorar" aria-label="Explorar">
              <Compass className="size-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link
              to="/notificaciones"
              aria-label={unread ? `Notificaciones (${unread} sin leer)` : 'Notificaciones'}
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </header>
      <main id="main" className="flex-1 px-4 pt-4 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

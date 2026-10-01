import { Navigate, Outlet, useLocation } from 'react-router'
import { ErrorState, PageLoader } from '@/components/states'
import { useMyProfile, useSessionStore } from './session'

/** Exige sesión iniciada. */
export function RequireAuth() {
  const { session, initialized, recovering } = useSessionStore()
  const location = useLocation()
  if (!initialized) return <PageLoader />
  if (recovering && location.pathname !== '/nueva-contrasena') {
    return <Navigate to="/nueva-contrasena" replace />
  }
  if (!session) return <Navigate to="/bienvenida" replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** Exige perfil completado (username, provincia, edad ≥ 14). */
export function RequireOnboarded() {
  const { data: profile, isLoading, error, refetch } = useMyProfile()
  if (isLoading) return <PageLoader />
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!profile?.onboarded) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

export function RequireAdmin() {
  const { data: profile, isLoading } = useMyProfile()
  if (isLoading) return <PageLoader />
  if (!profile?.is_admin) return <Navigate to="/" replace />
  return <Outlet />
}

/** Para pantallas públicas (login, registro): si ya hay sesión, a la app. */
export function RedirectIfAuthed() {
  const { session, initialized, recovering } = useSessionStore()
  if (!initialized) return <PageLoader />
  if (recovering) return <Navigate to="/nueva-contrasena" replace />
  if (session) return <Navigate to="/" replace />
  return <Outlet />
}

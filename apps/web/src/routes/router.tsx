import type { ReactElement } from 'react'
import { createHashRouter, Navigate, type RouteObject } from 'react-router'
import { AppLayout } from '@/components/layout/app-layout'
import {
  RedirectIfAuthed,
  RequireAdmin,
  RequireAuth,
  RequireOnboarded,
} from '@/features/auth/guards'
import { NotFoundPage } from './not-found-page'

/** Carga diferida de cada pantalla (code splitting por ruta). */
function page<M>(load: () => Promise<M>, render: (m: M) => ReactElement) {
  return async () => {
    const m = await load()
    return { element: render(m) }
  }
}

// HashRouter: GitHub Pages no reescribe rutas, así que usamos /#/ruta.
export const routes: RouteObject[] = [
  // Públicas
  {
    path: 'legal/privacidad',
    lazy: page(
      () => import('@/features/settings/legal-pages'),
      (m) => <m.PrivacyPage />,
    ),
  },
  {
    path: 'legal/terminos',
    lazy: page(
      () => import('@/features/settings/legal-pages'),
      (m) => <m.TermsPage />,
    ),
  },
  {
    path: 'legal/normas',
    lazy: page(
      () => import('@/features/settings/legal-pages'),
      (m) => <m.RulesPage />,
    ),
  },
  {
    element: <RedirectIfAuthed />,
    children: [
      {
        path: 'bienvenida',
        lazy: page(
          () => import('@/features/auth/welcome-page'),
          (m) => <m.WelcomePage />,
        ),
      },
      {
        path: 'entrar',
        lazy: page(
          () => import('@/features/auth/login-page'),
          (m) => <m.LoginPage />,
        ),
      },
      {
        path: 'registro',
        lazy: page(
          () => import('@/features/auth/register-page'),
          (m) => <m.RegisterPage />,
        ),
      },
      {
        path: 'recuperar',
        lazy: page(
          () => import('@/features/auth/password-pages'),
          (m) => <m.ForgotPasswordPage />,
        ),
      },
    ],
  },
  // Con sesión
  {
    element: <RequireAuth />,
    children: [
      {
        path: 'nueva-contrasena',
        lazy: page(
          () => import('@/features/auth/password-pages'),
          (m) => <m.ResetPasswordPage />,
        ),
      },
      {
        path: 'onboarding',
        lazy: page(
          () => import('@/features/auth/onboarding-page'),
          (m) => <m.OnboardingPage />,
        ),
      },
      {
        element: <RequireOnboarded />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                index: true,
                lazy: page(
                  () => import('@/features/feed/feed-page'),
                  (m) => <m.FeedPage />,
                ),
              },
              {
                path: 'misiones',
                lazy: page(
                  () => import('@/features/missions/missions-page'),
                  (m) => <m.MissionsPage />,
                ),
              },
              {
                path: 'misiones/:id',
                lazy: page(
                  () => import('@/features/missions/mission-detail-page'),
                  (m) => <m.MissionDetailPage />,
                ),
              },
              {
                path: 'subir',
                lazy: page(
                  () => import('@/features/missions/upload-page'),
                  (m) => <m.UploadPage />,
                ),
              },
              {
                path: 'ranking',
                lazy: page(
                  () => import('@/features/ranking/ranking-page'),
                  (m) => <m.RankingPage />,
                ),
              },
              {
                path: 'perfil',
                lazy: page(
                  () => import('@/features/profile/profile-page'),
                  (m) => <m.MyProfileRedirect />,
                ),
              },
              {
                path: 'u/:username',
                lazy: page(
                  () => import('@/features/profile/profile-page'),
                  (m) => <m.ProfilePage />,
                ),
              },
              {
                path: 'u/:username/seguidores',
                lazy: page(
                  () => import('@/features/profile/follow-list-page'),
                  (m) => <m.FollowListPage kind="followers" />,
                ),
              },
              {
                path: 'u/:username/siguiendo',
                lazy: page(
                  () => import('@/features/profile/follow-list-page'),
                  (m) => <m.FollowListPage kind="following" />,
                ),
              },
              {
                path: 'editar-perfil',
                lazy: page(
                  () => import('@/features/profile/edit-profile-page'),
                  (m) => <m.EditProfilePage />,
                ),
              },
              {
                path: 'p/:id',
                lazy: page(
                  () => import('@/features/feed/post-detail-page'),
                  (m) => <m.PostDetailPage />,
                ),
              },
              {
                path: 'explorar',
                lazy: page(
                  () => import('@/features/explore/explore-page'),
                  (m) => <m.ExplorePage />,
                ),
              },
              {
                path: 'explorar/tag/:tag',
                lazy: page(
                  () => import('@/features/explore/tag-page'),
                  (m) => <m.TagPage />,
                ),
              },
              { path: 'buscar', element: <Navigate to="/explorar?tab=gente" replace /> },
              {
                path: 'premios',
                lazy: page(
                  () => import('@/features/rewards/rewards-page'),
                  (m) => <m.RewardsPage />,
                ),
              },
              {
                path: 'validar',
                lazy: page(
                  () => import('@/features/validate/validate-page'),
                  (m) => <m.ValidatePage />,
                ),
              },
              {
                path: 'notificaciones',
                lazy: page(
                  () => import('@/features/notifications/notifications-page'),
                  (m) => <m.NotificationsPage />,
                ),
              },
              {
                path: 'ajustes',
                lazy: page(
                  () => import('@/features/settings/settings-page'),
                  (m) => <m.SettingsPage />,
                ),
              },
              {
                path: 'conectar-x',
                lazy: page(
                  () => import('@/features/x/connect-x-page'),
                  (m) => <m.ConnectXPage />,
                ),
              },
              {
                element: <RequireAdmin />,
                children: [
                  {
                    path: 'admin',
                    lazy: page(
                      () => import('@/features/admin/admin-page'),
                      (m) => <m.AdminPage />,
                    ),
                  },
                ],
              },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
]

export const router = createHashRouter(routes)

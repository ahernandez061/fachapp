import { createHashRouter, type RouteObject } from 'react-router'
import { AppLayout } from '@/components/layout/app-layout'
import { FeedPage } from '@/features/feed/feed-page'
import { MissionsPage } from '@/features/missions/missions-page'
import { UploadPage } from '@/features/missions/upload-page'
import { ProfilePage } from '@/features/profile/profile-page'
import { RankingPage } from '@/features/ranking/ranking-page'
import { NotFoundPage } from './not-found-page'

// HashRouter: GitHub Pages no reescribe rutas, así que usamos /#/ruta.
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <FeedPage /> },
      { path: 'misiones', element: <MissionsPage /> },
      { path: 'subir', element: <UploadPage /> },
      { path: 'ranking', element: <RankingPage /> },
      { path: 'perfil', element: <ProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createHashRouter(routes)

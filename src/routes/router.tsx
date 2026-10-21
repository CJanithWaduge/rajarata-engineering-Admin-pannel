import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../components/layout/AdminLayout'
import { GuestOnly } from '../features/auth/guards/GuestOnly'
import { RequireAdmin } from '../features/auth/guards/RequireAdmin'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { HomeContentPage } from '../features/home/pages/HomeContentPage'
import { SettingsPage } from '../features/settings/pages/SettingsPage'
import { DashboardPage } from '../pages/DashboardPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ROUTES } from './paths'

export const router = createBrowserRouter([
  {
    element: <GuestOnly />,
    children: [{ path: ROUTES.login, element: <LoginPage /> }],
  },
  {
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: ROUTES.dashboard, element: <DashboardPage /> },
          { path: ROUTES.home, element: <HomeContentPage /> },
          { path: ROUTES.settings, element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: ROUTES.root,
    element: <Navigate to={ROUTES.dashboard} replace />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AdminLayout } from '../components/layout/AdminLayout'
import { GuestOnly } from '../features/auth/guards/GuestOnly'
import { RequireAdmin } from '../features/auth/guards/RequireAdmin'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { AboutContentPage } from '../features/about/pages/AboutContentPage'
import { HomeContentPage } from '../features/home/pages/HomeContentPage'
import { ServicesContentPage } from '../features/services/pages/ServicesContentPage'
import { ProjectsContentPage } from '../features/projects/pages/ProjectsContentPage'
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
          { path: ROUTES.services, element: <ServicesContentPage /> },
          { path: ROUTES.about, element: <AboutContentPage /> },
          { path: ROUTES.projects, element: <ProjectsContentPage /> },
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

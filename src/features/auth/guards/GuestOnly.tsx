import { Navigate, Outlet } from 'react-router-dom'
import { FullPageSpinner } from '../../../components/ui/FullPageSpinner'
import { ROUTES } from '../../../routes/paths'
import { useAuth } from '../useAuth'

export function GuestOnly() {
  const { status, admin } = useAuth()

  if (status === 'loading') {
    return <FullPageSpinner />
  }

  if (status === 'authenticated' && admin) {
    return <Navigate to={ROUTES.dashboard} replace />
  }

  return <Outlet />
}

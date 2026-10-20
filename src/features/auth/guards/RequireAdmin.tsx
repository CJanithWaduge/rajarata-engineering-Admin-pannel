import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageSpinner } from '../../../components/ui/FullPageSpinner'
import { ROUTES } from '../../../routes/paths'
import { useAuth } from '../useAuth'

export function RequireAdmin() {
  const { status, admin } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <FullPageSpinner />
  }

  if (status !== 'authenticated' || !admin) {
    return (
      <Navigate
        to={ROUTES.login}
        replace
        state={{ from: location }}
      />
    )
  }

  return <Outlet />
}

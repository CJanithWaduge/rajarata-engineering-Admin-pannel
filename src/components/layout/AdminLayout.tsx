import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { ROUTES } from '../../routes/paths'
import { BrandLogo } from '../brand/BrandLogo'
import { Button } from '../ui/Button'

export function AdminLayout() {
  const { admin, logout } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)

    try {
      await logout()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-outline-variant bg-surface-container-lowest/95 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <Link
            to={ROUTES.dashboard}
            className="flex items-center gap-3 rounded-chip focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-container"
          >
            <BrandLogo className="h-8 w-auto" />
            <span
              className="hidden h-6 w-px bg-outline-variant sm:block"
              aria-hidden="true"
            />
            <span className="hidden font-label-caps text-label-caps uppercase tracking-widest text-primary sm:inline">
              Admin
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {admin ? (
              <span className="hidden font-body-sm text-body-sm text-secondary md:inline">
                {admin.email}
              </span>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              isLoading={isSigningOut}
              onClick={() => void handleSignOut()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { ROUTES } from '../../routes/paths'
import { BrandLogo } from '../brand/BrandLogo'
import { Button } from '../ui/Button'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DashboardIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  SettingsIcon,
} from './icons'

const SIDEBAR_STORAGE_KEY = 'rajarata-admin.sidebar-collapsed'

const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: ROUTES.home, label: 'Home Page', icon: HomeIcon, end: false },
  { to: ROUTES.settings, label: 'Site Settings', icon: SettingsIcon, end: false },
] as const

function readCollapsedPreference(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function AdminLayout() {
  const { admin, logout } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(readCollapsedPreference)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Escape closes the mobile drawer and the page behind it must not scroll.
  useEffect(() => {
    if (!isMobileOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileOpen(false)
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileOpen])

  const toggleCollapsed = () => {
    setIsCollapsed((previous) => {
      const next = !previous

      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0')
      } catch {
        // Storage can be blocked; the in-memory state still works for this session.
      }

      return next
    })
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)

    try {
      await logout()
    } finally {
      setIsSigningOut(false)
    }
  }

  const email = admin?.email ?? ''
  const displayName = admin?.displayName ?? ''
  const identity = displayName || email || 'Admin'
  const initial = identity.trim().charAt(0).toUpperCase() || 'A'

  return (
    <div className="min-h-screen bg-background">
      {isMobileOpen ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 h-full w-full bg-on-surface/40 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        id="admin-sidebar"
        aria-label="Admin sidebar"
        className={[
          'fixed inset-y-0 left-0 z-50 w-[264px] border-r border-outline-variant bg-surface-container-lowest transition-[transform,width,visibility] duration-200 ease-out lg:visible lg:translate-x-0',
          isMobileOpen ? 'visible translate-x-0 shadow-overlay' : 'invisible -translate-x-full',
          isCollapsed ? 'lg:w-[84px]' : 'lg:w-[264px]',
        ].join(' ')}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-outline-variant px-4">
            <Link
              to={ROUTES.dashboard}
              onClick={() => setIsMobileOpen(false)}
              aria-label="Rajarata Engineering admin dashboard"
              className="flex min-w-0 items-center rounded-chip focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-container"
            >
              {isCollapsed ? (
                <span className="hidden h-9 w-9 shrink-0 overflow-hidden lg:flex">
                  <BrandLogo className="h-9 w-auto max-w-none" />
                </span>
              ) : null}
              <BrandLogo className={`h-8 w-auto ${isCollapsed ? 'lg:hidden' : ''}`} />
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close navigation"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container lg:hidden"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setIsMobileOpen(false)}
                    title={isCollapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      [
                        'relative flex items-center gap-3 rounded-control py-2.5 font-label-md text-label-md transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container',
                        isCollapsed ? 'lg:justify-center lg:px-0' : 'px-3',
                        isActive
                          ? 'bg-primary-container/10 text-primary'
                          : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
                      ].join(' ')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          aria-hidden="true"
                          className={[
                            'absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary-container transition-opacity',
                            isActive ? 'opacity-100' : 'opacity-0',
                          ].join(' ')}
                        />
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className={`truncate ${isCollapsed ? 'lg:hidden' : ''}`}>
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-t border-outline-variant p-3">
            {admin ? (
              <div
                title={isCollapsed ? email || undefined : undefined}
                className={[
                  'mb-3 flex items-center gap-3 rounded-control bg-surface-container-low px-3 py-2.5',
                  isCollapsed ? 'lg:justify-center lg:px-0' : '',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container/15 font-label-md text-label-md text-primary"
                >
                  {initial}
                </span>
                <span className={`min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
                  <span className="block truncate font-label-md text-label-md text-on-surface">
                    {identity}
                  </span>
                  {displayName && email ? (
                    <span className="block truncate font-body-sm text-body-sm text-secondary">
                      {email}
                    </span>
                  ) : null}
                </span>
              </div>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              isLoading={isSigningOut}
              onClick={() => void handleSignOut()}
              aria-label="Sign out"
              title="Sign out"
              className={`w-full ${isCollapsed ? 'lg:px-0' : ''}`}
            >
              <LogoutIcon className="h-4 w-4 shrink-0" />
              <span className={isCollapsed ? 'lg:hidden' : ''}>Sign out</span>
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!isCollapsed}
          aria-controls="admin-sidebar"
          className="absolute -right-3 top-20 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant shadow-card transition-colors hover:border-primary-container hover:text-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container lg:flex"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeftIcon className="h-3.5 w-3.5" />
          )}
        </button>
      </aside>

      <div
        className={[
          'flex min-h-screen flex-col transition-[padding-left] duration-200 ease-out',
          isCollapsed ? 'lg:pl-[84px]' : 'lg:pl-[264px]',
        ].join(' ')}
      >
        <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur-md lg:hidden">
          <div className="flex h-16 items-center gap-3 px-4">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={isMobileOpen}
              aria-controls="admin-sidebar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-outline-variant text-on-surface transition-colors hover:bg-surface-container-high focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <Link
              to={ROUTES.dashboard}
              aria-label="Rajarata Engineering admin dashboard"
              className="flex items-center rounded-chip focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
            >
              <BrandLogo className="h-8 w-auto" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

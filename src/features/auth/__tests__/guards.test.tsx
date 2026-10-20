import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { GuestOnly } from '../guards/GuestOnly'
import { RequireAdmin } from '../guards/RequireAdmin'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))

vi.mock('../useAuth', () => ({
  useAuth: mocks.useAuth,
}))

const adminProfile = {
  uid: 'uid-1',
  email: 'admin@rajarata.test',
  displayName: null,
  role: 'admin' as const,
  active: true,
}

function authState(overrides: Record<string, unknown> = {}) {
  return {
    status: 'unauthenticated',
    user: null,
    admin: null,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  }
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route element={<RequireAdmin />}>
          <Route path="/dashboard" element={<p>dashboard page</p>} />
        </Route>
        <Route element={<GuestOnly />}>
          <Route path="/guest" element={<p>guest login page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAdmin', () => {
  it('shows a spinner while auth is loading', () => {
    mocks.useAuth.mockReturnValue(authState({ status: 'loading' }))

    renderAt('/dashboard')

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument()
  })

  it('redirects anonymous visitors to the login page', () => {
    mocks.useAuth.mockReturnValue(authState())

    renderAt('/dashboard')

    expect(screen.getByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument()
  })

  it('redirects authenticated users without an admin profile', () => {
    mocks.useAuth.mockReturnValue(
      authState({ status: 'authenticated', user: { uid: 'uid-1', email: null } }),
    )

    renderAt('/dashboard')

    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('renders the protected content for an active admin', () => {
    mocks.useAuth.mockReturnValue(
      authState({ status: 'authenticated', admin: adminProfile }),
    )

    renderAt('/dashboard')

    expect(screen.getByText('dashboard page')).toBeInTheDocument()
  })
})

describe('GuestOnly', () => {
  it('renders the login route for unauthenticated visitors', () => {
    mocks.useAuth.mockReturnValue(authState())

    renderAt('/guest')

    expect(screen.getByText('guest login page')).toBeInTheDocument()
  })

  it('redirects an authenticated admin away from login', () => {
    mocks.useAuth.mockReturnValue(
      authState({ status: 'authenticated', admin: adminProfile }),
    )

    renderAt('/guest')

    expect(screen.getByText('dashboard page')).toBeInTheDocument()
    expect(screen.queryByText('guest login page')).not.toBeInTheDocument()
  })

  it('shows a spinner while auth is loading', () => {
    mocks.useAuth.mockReturnValue(authState({ status: 'loading' }))

    renderAt('/guest')

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})

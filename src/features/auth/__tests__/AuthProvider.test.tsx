import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../AuthProvider'
import { useAuth } from '../useAuth'

const mocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  fetchAdminProfile: vi.fn(),
  signInAdmin: vi.fn(),
  signOutAdmin: vi.fn(),
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mocks.onAuthStateChanged,
}))

vi.mock('../../../lib/firebase', () => ({
  auth: { name: 'auth' },
}))

vi.mock('../authService', () => ({
  fetchAdminProfile: mocks.fetchAdminProfile,
  signInAdmin: mocks.signInAdmin,
  signOutAdmin: mocks.signOutAdmin,
}))

type AuthCallbackUser = { uid: string; email: string | null }
type AuthCallback = (user: AuthCallbackUser | null) => void

let authCallback: AuthCallback | undefined
const unsubscribe = vi.fn()

function emitAuth(user: AuthCallbackUser | null) {
  if (!authCallback) {
    throw new Error('Auth listener was not registered')
  }

  authCallback(user)
}

const adminProfile = {
  uid: 'uid-1',
  email: 'admin@rajarata.test',
  displayName: 'Site Admin',
  role: 'owner' as const,
  active: true,
}

function Probe() {
  const { status, admin, error, login, logout } = useAuth()

  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="admin">{admin?.email ?? 'none'}</p>
      <p data-testid="error">{error?.code ?? 'none'}</p>
      <button type="button" onClick={() => void login('admin@rajarata.test', 'secret')}>
        login
      </button>
      <button type="button" onClick={() => void logout()}>
        logout
      </button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authCallback = undefined
    mocks.onAuthStateChanged.mockImplementation(
      (_auth: unknown, callback: AuthCallback) => {
        authCallback = callback
        return unsubscribe
      },
    )
    mocks.fetchAdminProfile.mockResolvedValue(null)
    mocks.signOutAdmin.mockResolvedValue(undefined)
  })

  it('starts in loading and resolves to unauthenticated without a session', async () => {
    renderProvider()

    expect(screen.getByTestId('status')).toHaveTextContent('loading')

    await act(async () => {
      emitAuth(null)
    })

    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    expect(mocks.fetchAdminProfile).not.toHaveBeenCalled()
  })

  it('restores an active admin session', async () => {
    mocks.fetchAdminProfile.mockResolvedValue(adminProfile)
    renderProvider()

    await act(async () => {
      emitAuth({ uid: 'uid-1', email: 'admin@rajarata.test' })
    })

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })
    expect(screen.getByTestId('admin')).toHaveTextContent('admin@rajarata.test')
  })

  it('signs out and flags not-admin when the admin record is missing', async () => {
    mocks.fetchAdminProfile.mockResolvedValue(null)
    renderProvider()

    await act(async () => {
      emitAuth({ uid: 'uid-1', email: 'admin@rajarata.test' })
    })

    await waitFor(() => {
      expect(mocks.signOutAdmin).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    expect(screen.getByTestId('error')).toHaveTextContent('not-admin')
  })

  it('signs out when the admin profile lookup fails', async () => {
    mocks.fetchAdminProfile.mockRejectedValue(new Error('offline'))
    renderProvider()

    await act(async () => {
      emitAuth({ uid: 'uid-1', email: 'admin@rajarata.test' })
    })

    await waitFor(() => {
      expect(mocks.signOutAdmin).toHaveBeenCalledTimes(1)
    })
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    expect(screen.getByTestId('error')).toHaveTextContent('unknown')
  })

  it('authenticates after a successful login', async () => {
    mocks.signInAdmin.mockResolvedValue(adminProfile)
    const user = userEvent.setup()
    renderProvider()

    await act(async () => {
      emitAuth(null)
    })

    await user.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })
    expect(screen.getByTestId('admin')).toHaveTextContent('admin@rajarata.test')
    expect(screen.getByTestId('error')).toHaveTextContent('none')
  })

  it('surfaces mapped login failures and stays unauthenticated', async () => {
    mocks.signInAdmin.mockRejectedValue(
      Object.assign(new Error('bad'), { code: 'auth/invalid-credential' }),
    )
    const user = userEvent.setup()
    renderProvider()

    await act(async () => {
      emitAuth(null)
    })

    await user.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(
        'invalid-credentials',
      )
    })
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
  })

  it('clears the session on logout', async () => {
    mocks.fetchAdminProfile.mockResolvedValue(adminProfile)
    const user = userEvent.setup()
    renderProvider()

    await act(async () => {
      emitAuth({ uid: 'uid-1', email: 'admin@rajarata.test' })
    })

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    })

    await user.click(screen.getByRole('button', { name: 'logout' }))

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
    })
    expect(mocks.signOutAdmin).toHaveBeenCalledTimes(1)
  })
})

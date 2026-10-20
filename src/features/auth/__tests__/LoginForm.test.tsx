import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginForm } from '../components/LoginForm'
import type { AuthError } from '../types'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  clearError: vi.fn(),
  sendAdminResetEmail: vi.fn(),
}))

vi.mock('../useAuth', () => ({
  useAuth: () => ({
    status: 'unauthenticated',
    user: null,
    admin: null,
    error: null,
    login: mocks.login,
    logout: vi.fn(),
    clearError: mocks.clearError,
  }),
}))

vi.mock('../authService', () => ({
  sendAdminResetEmail: mocks.sendAdminResetEmail,
}))

type InitialEntry = string | { pathname: string; state?: unknown }

function renderForm(initialEntry: InitialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/dashboard" element={<p>dashboard page</p>} />
        <Route path="/services" element={<p>services page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks an empty submission and shows both required messages', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(mocks.login).not.toHaveBeenCalled()
  })

  it('blocks a malformed email before calling Firebase', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Email'), 'admin@')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByText('Enter a valid email address.'),
    ).toBeInTheDocument()
    expect(mocks.login).not.toHaveBeenCalled()
  })

  it('submits trimmed credentials and navigates on success', async () => {
    mocks.login.mockResolvedValue(null)
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Email'), '  admin@rajarata.test  ')
    await user.type(screen.getByLabelText('Password'), 'CorrectHorse1!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith(
        'admin@rajarata.test',
        'CorrectHorse1!',
      )
    })
    expect(await screen.findByText('dashboard page')).toBeInTheDocument()
  })

  it('returns to the intended route after login', async () => {
    mocks.login.mockResolvedValue(null)
    const user = userEvent.setup()
    renderForm({ pathname: '/login', state: { from: { pathname: '/services' } } })

    await user.type(screen.getByLabelText('Email'), 'admin@rajarata.test')
    await user.type(screen.getByLabelText('Password'), 'CorrectHorse1!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('services page')).toBeInTheDocument()
  })

  it('shows the mapped error, keeps the email, and clears the password', async () => {
    mocks.login.mockResolvedValue({
      code: 'invalid-credentials',
      message: 'Email or password is incorrect.',
    } satisfies AuthError)
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Email'), 'admin@rajarata.test')
    await user.type(screen.getByLabelText('Password'), 'WrongPassword1!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByText('Email or password is incorrect.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveValue('admin@rajarata.test')
    await waitFor(() => {
      expect(screen.getByLabelText('Password')).toHaveValue('')
    })
    expect(screen.queryByText('dashboard page')).not.toBeInTheDocument()
  })

  it('disables the submit button while a login is pending', async () => {
    let resolveLogin: ((value: AuthError | null) => void) | undefined
    mocks.login.mockReturnValue(
      new Promise<AuthError | null>((resolve) => {
        resolveLogin = resolve
      }),
    )
    const user = userEvent.setup()
    renderForm()

    await user.type(screen.getByLabelText('Email'), 'admin@rajarata.test')
    await user.type(screen.getByLabelText('Password'), 'CorrectHorse1!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    const submit = screen.getByRole('button', { name: 'Sign in' })
    await waitFor(() => {
      expect(submit).toBeDisabled()
    })
    expect(submit).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByLabelText('Email')).toBeDisabled()

    await act(async () => {
      resolveLogin?.(null)
    })

    expect(await screen.findByText('dashboard page')).toBeInTheDocument()
  })

  it('toggles password visibility and reports the pressed state', async () => {
    const user = userEvent.setup()
    renderForm()

    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password).toHaveAttribute('type', 'text')
    expect(
      screen.getByRole('button', { name: 'Hide password' }),
    ).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('sends a reset link and shows a neutral confirmation', async () => {
    mocks.sendAdminResetEmail.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))

    const dialog = screen.getByRole('dialog')
    await user.type(
      within(dialog).getByLabelText('Email'),
      'nobody@rajarata.test',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Send reset link' }),
    )

    await waitFor(() => {
      expect(mocks.sendAdminResetEmail).toHaveBeenCalledWith(
        'nobody@rajarata.test',
      )
    })
    expect(
      await screen.findByText(/reset link is on its way/i),
    ).toBeInTheDocument()
  })

  it('validates the reset email locally', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Forgot password?' }))

    const dialog = screen.getByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Send reset link' }),
    )

    expect(
      await within(dialog).findByText('Email is required.'),
    ).toBeInTheDocument()
    expect(mocks.sendAdminResetEmail).not.toHaveBeenCalled()
  })
})

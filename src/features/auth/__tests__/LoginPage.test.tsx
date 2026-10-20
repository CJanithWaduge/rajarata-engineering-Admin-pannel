import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LoginPage } from '../pages/LoginPage'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  sendAdminResetEmail: vi.fn(),
}))

vi.mock('../useAuth', () => ({
  useAuth: mocks.useAuth,
}))

vi.mock('../authService', () => ({
  sendAdminResetEmail: mocks.sendAdminResetEmail,
}))

describe('LoginPage', () => {
  it('renders the login form and any session-level admin error', () => {
    mocks.useAuth.mockReturnValue({
      status: 'unauthenticated',
      user: null,
      admin: null,
      error: {
        code: 'not-admin',
        message: 'This account does not have admin access.',
      },
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Admin sign in' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(
      screen.getByText('This account does not have admin access.'),
    ).toBeInTheDocument()
  })
})

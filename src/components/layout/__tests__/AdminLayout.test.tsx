import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const authMocks = vi.hoisted(() => ({
  logout: vi.fn(),
}))

vi.mock('../../../features/auth/useAuth', () => ({
  useAuth: () => ({
    admin: {
      uid: 'uid-1',
      email: 'admin@rajarata.test',
      displayName: null,
      role: 'admin',
      active: true,
    },
    logout: authMocks.logout,
  }),
}))

import { AdminLayout } from '../AdminLayout'

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<p>dashboard content</p>} />
          <Route path="/home" element={<p>home content</p>} />
          <Route path="/settings" element={<p>settings content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('renders the sidebar navigation and the active page', () => {
    renderLayout()

    expect(screen.getByRole('navigation', { name: 'Admin' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Site Settings' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home Page' })).toBeInTheDocument()
    expect(screen.getByText('dashboard content')).toBeInTheDocument()
  })

  it('collapses the sidebar and remembers the choice', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: 'Collapse navigation' }))

    expect(screen.getByRole('button', { name: 'Expand navigation' })).toBeInTheDocument()
    expect(window.localStorage.getItem('rajarata-admin.sidebar-collapsed')).toBe('1')
  })

  it('opens the mobile drawer and closes it with Escape', async () => {
    const user = userEvent.setup()
    renderLayout()

    const openButton = screen.getByRole('button', { name: 'Open navigation' })
    expect(openButton).toHaveAttribute('aria-expanded', 'false')

    await user.click(openButton)
    expect(openButton).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')
    expect(openButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('signs out from the sidebar', async () => {
    const user = userEvent.setup()
    authMocks.logout.mockResolvedValue(undefined)
    renderLayout()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(authMocks.logout).toHaveBeenCalledTimes(1)
  })
})

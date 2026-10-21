import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  settings: {
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    facebookUrl: '',
    facebookLabel: '',
    location: '',
    updatedAt: null,
    updatedBy: null,
  },
}))

vi.mock('../useSettings', () => ({
  useSettings: () => ({
    status: 'ready',
    settings: mocks.settings,
    exists: true,
    error: null,
    reload: vi.fn(),
    save: mocks.save,
  }),
}))

vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({
    admin: {
      uid: 'uid-1',
      email: 'admin@rajarata.test',
      displayName: null,
      role: 'admin',
      active: true,
    },
  }),
}))

vi.mock('../components/UnsavedChangesGuard', () => ({
  UnsavedChangesGuard: () => null,
}))

import { SettingsPage } from '../pages/SettingsPage'

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.save.mockResolvedValue(null)
  })

  it('shows a dismissible toast after a save', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    await user.type(screen.getByLabelText('Phone number'), '+94771234567')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Successfully saved changes')).toBeInTheDocument()
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '+94771234567' }),
      'uid-1',
    )

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }))

    expect(screen.queryByText('Successfully saved changes')).not.toBeInTheDocument()
  })
})

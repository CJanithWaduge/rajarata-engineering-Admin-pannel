import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  status: 'ready' as 'loading' | 'ready' | 'saving' | 'error',
  exists: true,
  error: null as string | null,
  settings: {
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    facebookUrl: '',
    facebookLabel: '',
    location: '',
    mapEmbedUrl: '',
    logoUrl: '',
    logoAlt: '',
    logoPath: '',
    logoWidth: 0,
    logoHeight: 0,
    logoSize: 0,
    logoContentType: '',
    updatedAt: null,
    updatedBy: null,
  },
}))

vi.mock('../useSettings', () => ({
  useSettings: () => ({
    status: mocks.status,
    settings: mocks.settings,
    exists: mocks.exists,
    error: mocks.error,
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
    mocks.status = 'ready'
    mocks.exists = true
    mocks.error = null
    mocks.save.mockResolvedValue(null)
  })

  it('does not present an empty form when the initial Firestore read fails', () => {
    mocks.status = 'error'
    mocks.exists = false
    mocks.error = 'Could not load settings'

    render(<SettingsPage />)

    expect(screen.getByText('Could not load settings')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
    expect(
      screen.queryByText(/No site settings document exists yet/),
    ).not.toBeInTheDocument()
  })

  it('shows a dismissible toast after a save', async () => {
    const user = userEvent.setup()
    render(<SettingsPage />)

    await user.type(screen.getByLabelText('Phone number'), '+94771234567')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Successfully saved changes')).toBeInTheDocument()
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: '+94771234567',
        image: expect.objectContaining({ kind: 'none' }),
      }),
      'uid-1',
      expect.objectContaining({ phone: '' }),
    )

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }))

    expect(screen.queryByText('Successfully saved changes')).not.toBeInTheDocument()
  })
})

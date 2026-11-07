import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mocks = vi.hoisted(() => ({
  seedAllContent: vi.fn(),
}))

vi.mock('../seedContentService', () => ({
  seedAllContent: mocks.seedAllContent,
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

import { SeedButton } from '../components/SeedButton'

function stubConfirm(result: boolean) {
  return vi.spyOn(window, 'confirm').mockReturnValue(result)
}

describe('SeedButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.seedAllContent.mockResolvedValue({ pages: ['Services', 'Home', 'About', 'Projects'] })
  })

  it('does nothing when the overwrite confirmation is cancelled', async () => {
    const confirm = stubConfirm(false)
    const user = userEvent.setup()
    render(<SeedButton />)

    await user.click(screen.getByRole('button', { name: 'Seed page content' }))

    expect(confirm).toHaveBeenCalledTimes(1)
    expect(mocks.seedAllContent).not.toHaveBeenCalled()
    confirm.mockRestore()
  })

  it('reports which pages were written on success', async () => {
    const confirm = stubConfirm(true)
    const user = userEvent.setup()
    render(<SeedButton />)

    await user.click(screen.getByRole('button', { name: 'Seed page content' }))

    expect(mocks.seedAllContent).toHaveBeenCalledWith('uid-1')
    expect(
      await screen.findByText(
        'Seeded Services, Home, About, Projects. Reload those pages to see the new content.',
      ),
    ).toBeInTheDocument()
    confirm.mockRestore()
  })

  it('shows the failure message instead of failing silently', async () => {
    const confirm = stubConfirm(true)
    mocks.seedAllContent.mockRejectedValue(
      new Error('Services could not be seeded. validation failed'),
    )
    const user = userEvent.setup()
    render(<SeedButton />)

    await user.click(screen.getByRole('button', { name: 'Seed page content' }))

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('Services could not be seeded. validation failed')
    confirm.mockRestore()
  })
})

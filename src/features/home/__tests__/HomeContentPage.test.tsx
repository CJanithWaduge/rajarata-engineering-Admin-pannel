import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  reload: vi.fn(),
  state: {
    status: 'ready' as 'loading' | 'ready' | 'saving' | 'error',
    content: null as unknown,
    exists: true,
    error: null as string | null,
    version: 1,
  },
}))

vi.mock('../useHomeContent', () => ({
  useHomeContent: () => ({
    ...mocks.state,
    save: mocks.save,
    reload: mocks.reload,
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

import { HomeContentPage } from '../pages/HomeContentPage'
import type { HomeContent, HomeImage } from '../types'

function image(prefix: string): HomeImage {
  return {
    url: `https://firebasestorage.googleapis.com/v0/b/test/o/${prefix}`,
    path: `home/${prefix}`,
    alt: `Alt ${prefix}`,
    width: 1600,
    height: 1000,
    size: 1000,
    contentType: 'image/jpeg',
  }
}

function content(): HomeContent {
  return {
    hero: image('hero'),
    featuredProjects: [
      {
        image: image('card-1'),
        category: 'Industrial',
        venue: 'Anuradhapura',
        topic: 'Industrial Distribution',
        tag: 'MV / LV',
      },
      {
        image: image('card-2'),
        category: 'Commercial',
        venue: 'Anuradhapura',
        topic: 'Commercial Panels',
        tag: 'Panels',
      },
      {
        image: image('card-3'),
        category: 'ELV',
        venue: 'Anuradhapura',
        topic: 'ELV Systems',
        tag: 'Automation',
      },
    ],
    updatedAt: null,
    updatedBy: null,
  }
}

describe('HomeContentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.state.status = 'ready'
    mocks.state.content = content()
    mocks.state.exists = true
    mocks.state.error = null
    mocks.state.version = 1
    mocks.save.mockResolvedValue(null)
    mocks.reload.mockResolvedValue(undefined)
  })

  it('saves the page and shows a toast', async () => {
    const user = userEvent.setup()
    render(<HomeContentPage />)

    const venues = screen.getAllByLabelText('Venue')
    await user.clear(venues[1])
    await user.type(venues[1], 'Kandy')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Successfully saved changes')).toBeInTheDocument()
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({ cards: expect.any(Array) }),
      'uid-1',
    )
  })

  it('shows the empty state when the document does not exist', () => {
    mocks.state.content = null
    mocks.state.exists = false

    render(<HomeContentPage />)

    expect(screen.getByText(/No home page content exists yet/)).toBeInTheDocument()
  })

  it('shows a read error and retries', async () => {
    const user = userEvent.setup()
    mocks.state.status = 'error'
    mocks.state.content = null
    mocks.state.exists = false
    mocks.state.error = 'Network error. Check your connection and try again.'

    render(<HomeContentPage />)

    expect(screen.getByText('Network error. Check your connection and try again.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))

    expect(mocks.reload).toHaveBeenCalledTimes(1)
  })

  it('shows the page heading', () => {
    render(<HomeContentPage />)

    expect(
      screen.getByRole('heading', { name: 'Home Page Settings' }),
    ).toBeInTheDocument()
  })
})

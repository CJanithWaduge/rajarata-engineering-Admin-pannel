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

vi.mock('../../../components/ui/UnsavedChangesGuard', () => ({
  UnsavedChangesGuard: () => null,
}))

import { HomeContentPage } from '../pages/HomeContentPage'
import { HomeError } from '../errors'
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
    featuredServices: [
      {
        icon: 'home_repair_service',
        title: 'Residential & Commercial Wiring',
        description: 'Complete wiring for homes and offices.',
        href: '/services#service-01',
      },
      {
        icon: 'precision_manufacturing',
        title: 'Industrial Electrical Installations',
        description: 'High-demand manufacturing floor power drops.',
        href: '/services#service-02',
      },
      {
        icon: 'assignment_turned_in',
        title: 'Testing & Commissioning',
        description: 'Insulation resistance and loop impedance checks.',
        href: '/services#service-05',
      },
      {
        icon: 'build_circle',
        title: 'Maintenance & Troubleshooting',
        description: 'Fault finding and preventive upkeep of LV systems.',
        href: '/services#service-06',
      },
      {
        icon: 'lan',
        title: 'All Kinds of ELV Solutions',
        description: 'Structured cabling, access control, and CCTV networks.',
        href: '/services#service-07',
      },
      {
        icon: 'bolt',
        title: 'Lightning Protection System (LPS)',
        description: 'ESE and conventional air terminal networks.',
        href: '/services#service-08',
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

  it('shows an error toast when saving fails', async () => {
    const user = userEvent.setup()
    mocks.save.mockResolvedValue(new HomeError('upload'))
    render(<HomeContentPage />)

    const venues = screen.getAllByLabelText('Venue')
    await user.clear(venues[1])
    await user.type(venues[1], 'Kandy')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Firebase Storage is not ready. Enable Storage for this project, deploy storage.rules, then try again.',
    )
    expect(screen.queryByText('Successfully saved changes')).not.toBeInTheDocument()
  })

  it('shows the empty state when the document does not exist', () => {    mocks.state.content = null
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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mocks = vi.hoisted(() => ({
  readImageFile: vi.fn(),
  onSubmit: vi.fn(),
}))

vi.mock('../imageValidation', () => ({
  readImageFile: mocks.readImageFile,
  formatBytes: (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${bytes} B`,
}))

vi.mock('../../../components/ui/UnsavedChangesGuard', () => ({
  UnsavedChangesGuard: () => null,
}))

import { HomeContentForm } from '../components/HomeContentForm'
import type { HomeContent, HomeDraft, HomeImage } from '../types'

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
        title: 'Residential, Commercial & Industrial Electrical Installations',
        description:
          'Complete electrical wiring, power distribution, and installation for homes, offices, commercial buildings, and industrial facilities with high safety standards.',
        href: '/services#service-01',
      },
      {
        icon: 'security',
        title: 'CCTV Camera Installation & Maintenance',
        description:
          'Professional security camera setup, advanced surveillance configuration, and regular maintenance to ensure maximum protection for your premises.',
        href: '/services#service-07',
      },
      {
        icon: 'electric_meter',
        title: 'MDB / SMDB Panel Installation',
        description:
          'Expert installation, wiring, and configuration of Main Distribution Boards (MDB) and Sub Main Distribution Boards (SMDB) for reliable and efficient power control.',
        href: '/services#service-03',
      },
    ],
    updatedAt: null,
    updatedBy: null,
  }
}

function renderForm(initial: HomeContent | null = content()) {
  return render(
    <HomeContentForm
      initial={initial}
      isSaving={false}
      errorMessage={null}
      onSubmit={mocks.onSubmit}
    />,
  )
}

describe('HomeContentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.onSubmit.mockResolvedValue(undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ icons: [] }),
      })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the stored hero and all three cards', () => {
    renderForm()

    expect(screen.getByRole('heading', { name: 'Hero image' })).toBeInTheDocument()
    expect(screen.getAllByLabelText('Category')).toHaveLength(3)
    expect(screen.getByDisplayValue('Industrial')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Commercial')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ELV')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand Hero image' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand Card 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand Card 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand Card 3' })).toBeInTheDocument()
  })

  it('renders exactly three featured service slots', () => {
    renderForm()

    expect(
      screen.getByRole('button', { name: 'Expand Service Card 1' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Expand Service Card 2' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Expand Service Card 3' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Expand Service Card 4' }),
    ).not.toBeInTheDocument()
  })

  it('searches the supported icons and saves the selected service icon', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Expand Service Card 1' }))

    const searches = screen.getAllByLabelText('Search icons')
    await user.type(searches[0]!, 'security')
    await user.click(screen.getByRole('radio', { name: 'Security' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(mocks.onSubmit).toHaveBeenCalledTimes(1)
    const draft = mocks.onSubmit.mock.calls[0]?.[0] as HomeDraft
    expect(draft.services[0]?.icon).toBe('security')
  })

  it('collapses and expands the hero and a project card', async () => {
    const user = userEvent.setup()
    renderForm()

    const heroToggle = screen.getByRole('button', { name: 'Expand Hero image' })
    const heroContent = document.getElementById(
      heroToggle.getAttribute('aria-controls') ?? '',
    )
    expect(heroContent).toHaveAttribute('hidden')

    await user.click(heroToggle)
    expect(screen.getByRole('button', { name: 'Collapse Hero image' })).toBeInTheDocument()
    expect(heroContent).not.toHaveAttribute('hidden')

    await user.click(screen.getByRole('button', { name: 'Collapse Hero image' }))
    expect(heroContent).toHaveAttribute('hidden')

    const cardToggle = screen.getByRole('button', { name: 'Expand Card 2' })
    const cardContent = document.getElementById(
      cardToggle.getAttribute('aria-controls') ?? '',
    )
    expect(cardContent).toHaveAttribute('hidden')

    await user.click(cardToggle)
    expect(screen.getByRole('button', { name: 'Collapse Card 2' })).toBeInTheDocument()
    expect(cardContent).not.toHaveAttribute('hidden')
  })

  it('reopens a collapsed card when its validation fails', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Expand Card 1' }))
    const categories = screen.getAllByLabelText('Category')
    await user.clear(categories[0]!)
    await user.click(screen.getByRole('button', { name: 'Collapse Card 1' }))
    expect(screen.getByRole('button', { name: 'Expand Card 1' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Category is required.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse Card 1' })).toBeInTheDocument()
  })

  it('submits an edit to one card without touching the others', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Expand Card 2' }))
    const venues = screen.getAllByLabelText('Venue')
    await user.clear(venues[1])
    await user.type(venues[1], 'Kandy')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(mocks.onSubmit).toHaveBeenCalledTimes(1)
    const draft = mocks.onSubmit.mock.calls[0]?.[0] as HomeDraft
    expect(draft.cards[0]?.venue).toBe('Anuradhapura')
    expect(draft.cards[1]?.venue).toBe('Kandy')
    expect(draft.cards[2]?.venue).toBe('Anuradhapura')
  })

  it('saves one card while the hero and other cards stay blank', async () => {
    const user = userEvent.setup()
    mocks.readImageFile.mockResolvedValue({
      ok: true,
      image: {
        file: new File(['x'], 'card-1.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:card-1',
        width: 1600,
        height: 900,
        size: 1000,
        contentType: 'image/jpeg',
        originalSize: 1000,
        optimized: false,
      },
    })
    renderForm(null)

    await user.click(screen.getByRole('button', { name: 'Expand Card 1' }))
    await user.upload(
      screen.getByLabelText('Card 1 image') as HTMLInputElement,
      new File(['x'], 'card-1.jpg', { type: 'image/jpeg' }),
    )

    const alts = screen.getAllByLabelText('Image alt text')
    const categories = screen.getAllByLabelText('Category')
    const venues = screen.getAllByLabelText('Venue')
    const topics = screen.getAllByLabelText('Topic')
    await user.type(alts[1]!, 'Card one alt')
    await user.type(categories[0]!, 'Industrial')
    await user.type(venues[0]!, 'Anuradhapura')
    await user.type(topics[0]!, 'Industrial Distribution')

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(mocks.onSubmit).toHaveBeenCalledTimes(1)
    const draft = mocks.onSubmit.mock.calls[0]?.[0] as HomeDraft
    expect(draft.hero.image.kind).toBe('none')
    expect(draft.cards[0]?.image.kind).toBe('new')
    expect(draft.cards[0]?.category).toBe('Industrial')
    expect(draft.cards[1]?.image.kind).toBe('none')
    expect(draft.cards[1]?.category).toBe('')
    expect(draft.cards[2]?.image.kind).toBe('none')
  })

  it('saves only the hero while all cards stay blank', async () => {
    const user = userEvent.setup()
    mocks.readImageFile.mockResolvedValue({
      ok: true,
      image: {
        file: new File(['x'], 'hero.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:hero',
        width: 1600,
        height: 1000,
        size: 1000,
        contentType: 'image/jpeg',
        originalSize: 1000,
        optimized: false,
      },
    })
    renderForm(null)

    await user.click(screen.getByRole('button', { name: 'Expand Hero image' }))
    await user.upload(
      screen.getByLabelText('Hero image') as HTMLInputElement,
      new File(['x'], 'hero.jpg', { type: 'image/jpeg' }),
    )

    const alts = screen.getAllByLabelText('Image alt text')
    await user.type(alts[0]!, 'Hero alt')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(mocks.onSubmit).toHaveBeenCalledTimes(1)
    const draft = mocks.onSubmit.mock.calls[0]?.[0] as HomeDraft
    expect(draft.hero.image.kind).toBe('new')
    expect(draft.hero.alt).toBe('Hero alt')
    expect(draft.cards.every((card) => card.image.kind === 'none')).toBe(true)
  })

  it('blocks a save with an empty required field', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Expand Card 1' }))
    const categories = screen.getAllByLabelText('Category')
    await user.clear(categories[0])
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(mocks.onSubmit).not.toHaveBeenCalled()
    expect(await screen.findByText('Category is required.')).toBeInTheDocument()
  })

  it('shows a valid image preview after local validation', async () => {
    const user = userEvent.setup()
    mocks.readImageFile.mockResolvedValue({
      ok: true,
      image: {
        file: new File(['x'], 'hero.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:new-hero',
        width: 1600,
        height: 1000,
        size: 1000,
        contentType: 'image/jpeg',
      },
    })
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Expand Hero image' }))
    const fileInput = screen.getByLabelText('Hero image')
    await user.upload(
      fileInput as HTMLInputElement,
      new File(['x'], 'hero.jpg', { type: 'image/jpeg' }),
    )

    expect(await screen.findByText(/hero\.jpg/)).toBeInTheDocument()
    expect(document.querySelector('img[src="blob:new-hero"]')).toBeInTheDocument()
  })

  it('shows the optimized size after a large image is reduced', async () => {
    const user = userEvent.setup()
    mocks.readImageFile.mockResolvedValue({
      ok: true,
      image: {
        file: new File(['x'], 'hero.jpg', { type: 'image/jpeg' }),
        previewUrl: 'blob:optimized',
        width: 2400,
        height: 1500,
        size: 1024 * 1024,
        contentType: 'image/jpeg',
        originalSize: 8 * 1024 * 1024,
        optimized: true,
      },
    })
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Expand Hero image' }))
    await user.upload(
      screen.getByLabelText('Hero image') as HTMLInputElement,
      new File(['x'], 'hero.jpg', { type: 'image/jpeg' }),
    )

    expect(await screen.findByText(/optimized from 8\.0 MB/)).toBeInTheDocument()
    expect(document.querySelector('img[src="blob:optimized"]')).toBeInTheDocument()
  })

  it('keeps the stored image and shows the reason when validation fails', async () => {
    const user = userEvent.setup()
    mocks.readImageFile.mockResolvedValue({
      ok: false,
      message: 'The image is too large. The maximum is 5 MB.',
    })
    renderForm()

    await user.click(screen.getByRole('button', { name: 'Expand Hero image' }))
    const fileInput = screen.getByLabelText('Hero image')
    await user.upload(
      fileInput as HTMLInputElement,
      new File(['x'], 'hero.jpg', { type: 'image/jpeg' }),
    )

    expect(
      await screen.findByText('The image is too large. The maximum is 5 MB.'),
    ).toBeInTheDocument()
    expect(document.querySelector('img[src*="hero"]')).toBeInTheDocument()
    expect(document.querySelector('img[src="blob:new-hero"]')).not.toBeInTheDocument()
  })

  it('allows seeded project copy to save without uploaded images', async () => {
    const user = userEvent.setup()
    const partial = content()
    partial.featuredProjects[2] = {
      ...partial.featuredProjects[2]!,
      image: { ...image('card-3'), url: '' },
    }
    renderForm(partial)

    await user.click(screen.getByRole('button', { name: 'Expand Card 1' }))
    const venues = screen.getAllByLabelText('Venue')
    await user.type(venues[0], ' Kandy')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(mocks.onSubmit).toHaveBeenCalledTimes(1)
  })

  it('renders a blank form when there is no stored document', () => {
    renderForm(null)

    expect(screen.getAllByText('No image selected')).toHaveLength(4)
    expect(screen.getAllByLabelText('Category')).toHaveLength(3)
    expect(screen.getAllByLabelText('Category')[0]).toHaveValue('')
  })

  it('shows the resolution, aspect ratio, and size limits for each image', () => {
    renderForm(null)

    expect(screen.getByText(/Exactly 1920 × 1080 px \(16:9\)/)).toBeInTheDocument()
    expect(screen.getAllByText(/Exactly 1200 × 800 px \(3:2\)/)).toHaveLength(3)
  })
})

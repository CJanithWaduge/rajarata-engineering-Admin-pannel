import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mocks = vi.hoisted(() => ({
  readImageFile: vi.fn(),
  onSubmit: vi.fn(),
}))

vi.mock('../imageValidation', () => ({
  readImageFile: mocks.readImageFile,
  formatBytes: (bytes: number) => `${bytes} B`,
}))

vi.mock('../components/UnsavedChangesGuard', () => ({
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

  it('blocks a save when a card has no image', async () => {
    const user = userEvent.setup()
    const partial = content()
    partial.featuredProjects[2] = {
      ...partial.featuredProjects[2]!,
      image: { ...image('card-3'), url: '' },
    }
    renderForm(partial)

    await user.click(screen.getByRole('button', { name: 'Expand Card 1' }))
    const venues = screen.getAllByLabelText('Venue')
    await user.type(venues[0], ' ')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Choose an image for this card.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse Card 3' })).toBeInTheDocument()
    expect(mocks.onSubmit).not.toHaveBeenCalled()
  })

  it('renders a blank form when there is no stored document', () => {
    renderForm(null)

    expect(screen.getAllByText('No image selected')).toHaveLength(4)
    expect(screen.getAllByLabelText('Category')).toHaveLength(3)
    expect(screen.getAllByLabelText('Category')[0]).toHaveValue('')
  })
})

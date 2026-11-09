import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../components/ui/UnsavedChangesGuard', () => ({
  UnsavedChangesGuard: () => null,
}))

import { AboutContentForm } from '../components/AboutContentForm'
import type { AboutContent } from '../types'
import { validContent } from './testData'

function renderForm(
  initial: AboutContent | null,
  onSubmit = vi.fn(),
  isSaving = false,
) {
  render(
    <MemoryRouter>
      <AboutContentForm
        initial={initial}
        onSubmit={onSubmit}
        isSaving={isSaving}
        errorMessage={null}
      />
    </MemoryRouter>,
  )
  return onSubmit
}

describe('AboutContentForm', { timeout: 20_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts clean with Save disabled and no contact fields', () => {
    renderForm(validContent())

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(screen.queryByLabelText(/phone number/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/whatsapp number/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/address/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/facebook/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Hero image')).toBeInTheDocument()
  })

  it('previews the hero in a fixed 16:9 frame and requires a 1920 × 1080 image', () => {
    renderForm(validContent())

    const heroImage = document.querySelector(
      'img[src*="about%2Fhero%2Fstored.webp"]',
    )
    expect(heroImage?.parentElement).toHaveClass('aspect-[16/9]')
    expect(
      screen.getByText(/Exactly 1920 × 1080 px \(16:9\)/),
    ).toBeInTheDocument()
  })

  it('opens Core Pillars with five fixed editors', async () => {
    const user = userEvent.setup()
    renderForm(validContent())

    await user.click(screen.getByRole('button', { name: 'Expand Core Pillars' }))

    expect(screen.getByText('Pillar 1')).toBeInTheDocument()
    expect(screen.getByText('Pillar 5')).toBeInTheDocument()
    const pillars = screen.getByRole('group', { name: 'Pillars' })
    expect(within(pillars).getAllByLabelText('Icon')).toHaveLength(5)
  })

  it('links contact numbers to Site Settings instead of rendering inputs', async () => {
    const user = userEvent.setup()
    renderForm(validContent())

    await user.click(screen.getByRole('button', { name: 'Expand CTA' }))

    expect(screen.getByRole('link', { name: 'Site Settings' })).toHaveAttribute(
      'href',
      '/settings',
    )
    expect(screen.getByText(/Only their labels are edited here/)).toBeInTheDocument()
  })

  it('rejects an over-limit value and focuses an error', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm(validContent())
    const title = document.getElementById('about-hero-title') as HTMLInputElement

    fireEvent.change(title, { target: { value: 'x'.repeat(101) } })
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(
      screen.getByText('Hero title must be 100 characters or fewer.'),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('opens a collapsed section that owns a validation error', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm(validContent())
    const heritageTitle = document.getElementById(
      'about-heritage-title',
    ) as HTMLInputElement

    expect(heritageTitle).not.toBeVisible()
    fireEvent.change(heritageTitle, { target: { value: 'x'.repeat(101) } })
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(onSubmit).not.toHaveBeenCalled()
    await waitFor(() => expect(heritageTitle).toBeVisible())
    expect(
      screen.getByText('Story title must be 100 characters or fewer.'),
    ).toBeInTheDocument()
  })

  it('allows blank text and saves an empty string', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm(validContent())
    const title = document.getElementById('about-hero-title') as HTMLInputElement

    await user.clear(title)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0].hero.title).toBe('')
    expect(onSubmit.mock.calls[0]?.[0].hero.image.kind).toBe('stored')
  })

  it('requires alt text only when a hero image is selected', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm(validContent())
    const alt = document.getElementById('about-hero-alt') as HTMLInputElement

    await user.clear(alt)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(
      screen.getByText('Add alt text for the selected hero image.'),
    ).toBeInTheDocument()
  })

  it('clears the image back to the public page hero', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm(validContent())

    await user.click(screen.getByRole('button', { name: 'Use public image' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0].hero.image).toEqual({ kind: 'none' })
    expect(
      screen.getByText(/The public page hero will be used/),
    ).toBeInTheDocument()
  })

  it('submits the complete edited document with the stored image', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm(validContent())
    const title = document.getElementById('about-hero-title') as HTMLInputElement

    await user.clear(title)
    await user.type(title, 'Changed hero title')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        hero: expect.objectContaining({
          title: 'Changed hero title',
          image: expect.objectContaining({
            kind: 'stored',
            image: expect.objectContaining({ path: 'about/hero/stored.webp' }),
          }),
        }),
        heritage: expect.objectContaining({
          milestones: expect.any(Array),
        }),
        pillars: expect.objectContaining({ items: expect.any(Array) }),
        methodology: expect.objectContaining({ steps: expect.any(Array) }),
        industries: expect.objectContaining({ sectors: expect.any(Array) }),
      }),
    )
    expect(onSubmit.mock.calls[0]?.[0].hero.snapshots).toHaveLength(3)
    expect(onSubmit.mock.calls[0]?.[0].heritage.milestones).toHaveLength(4)
    expect(onSubmit.mock.calls[0]?.[0].pillars.items).toHaveLength(5)
    expect(onSubmit.mock.calls[0]?.[0].methodology.steps).toHaveLength(5)
    expect(onSubmit.mock.calls[0]?.[0].industries.sectors).toHaveLength(6)
  })

  it('shows the saving state and disables the submit control', () => {
    renderForm(validContent(), vi.fn(), true)

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
  })
})

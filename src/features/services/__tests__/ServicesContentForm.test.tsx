import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../components/ui/UnsavedChangesGuard', () => ({
  UnsavedChangesGuard: () => null,
}))

import { ServicesContentForm } from '../components/ServicesContentForm'
import type { ServicesContent } from '../types'
import { validContent } from './testData'

function renderForm(
  initial: ServicesContent | null,
  onSubmit = vi.fn(),
  isSaving = false,
) {
  render(
    <MemoryRouter>
      <ServicesContentForm
        initial={initial}
        onSubmit={onSubmit}
        isSaving={isSaving}
        errorMessage={null}
      />
    </MemoryRouter>,
  )
  return onSubmit
}

describe('ServicesContentForm', { timeout: 20_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts clean with Save disabled and no contact fields', { timeout: 20_000 }, () => {
    renderForm(validContent())

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/whatsapp/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/address/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/facebook/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/location/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/image/i)).not.toBeInTheDocument()
  })

  it('opens Service Cards with eight fixed editors and read-only anchors', async () => {
    const user = userEvent.setup()
    renderForm(validContent())

    await user.click(screen.getByRole('button', { name: 'Expand Service Cards' }))

    expect(
      screen.getAllByRole('group', { name: /^Service \d+$/ }),
    ).toHaveLength(8)
    expect(screen.getByText('01 · #service-01')).toBeInTheDocument()
    expect(screen.getByText('08 · #service-08')).toBeInTheDocument()
  })

  it('links contact changes to Site Settings instead of rendering inputs', async () => {
    const user = userEvent.setup()
    renderForm(validContent())

    await user.click(screen.getByRole('button', { name: 'Expand CTA' }))

    expect(screen.getByRole('link', { name: 'Site Settings' })).toHaveAttribute(
      'href',
      '/settings',
    )
    expect(
      screen.getByText(/WhatsApp and phone buttons come from/),
    ).toBeInTheDocument()
  })

  it('submits when only the title is filled and the other text fields are blank', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm(null)
    const title = document.getElementById('services-hero-title') as HTMLInputElement
    await user.type(title, 'Only a title')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        hero: expect.objectContaining({ title: 'Only a title' }),
        services: expect.any(Array),
        process: expect.objectContaining({ steps: expect.any(Array) }),
      }),
    )
    expect(onSubmit.mock.calls[0]?.[0].services).toHaveLength(8)
    expect(onSubmit.mock.calls[0]?.[0].process.steps).toHaveLength(6)
  })

  it('submits with a blank directory title because text is optional', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm(validContent())
    const directoryTitle = document.getElementById(
      'services-directory-title',
    ) as HTMLInputElement

    expect(directoryTitle).not.toBeVisible()
    fireEvent.change(directoryTitle, { target: { value: '' } })
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        directory: expect.objectContaining({ title: '' }),
      }),
    )
  })

  it('submits the complete edited document', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm(validContent())
    const title = document.getElementById('services-hero-title') as HTMLInputElement

    await user.clear(title)
    await user.type(title, 'Changed hero title')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        hero: expect.objectContaining({ title: 'Changed hero title' }),
        services: expect.any(Array),
        process: expect.objectContaining({ steps: expect.any(Array) }),
      }),
    )
    expect(onSubmit.mock.calls[0]?.[0].services).toHaveLength(8)
    expect(onSubmit.mock.calls[0]?.[0].process.steps).toHaveLength(6)
  })

  it('shows the saving state and disables the submit control', () => {
    renderForm(validContent(), vi.fn(), true)

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
  })
})

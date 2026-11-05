import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../../components/ui/UnsavedChangesGuard', () => ({
  UnsavedChangesGuard: () => null,
}))

import { ProjectsContentForm } from '../components/ProjectsContentForm'
import type { ProjectsContent } from '../types'
import { validContent } from './testData'

function renderForm(
  initial: ProjectsContent | null,
  onSubmit = vi.fn(),
  isSaving = false,
) {
  render(
    <MemoryRouter>
      <ProjectsContentForm
        initial={initial}
        onSubmit={onSubmit}
        isSaving={isSaving}
        errorMessage={null}
      />
    </MemoryRouter>,
  )
  return onSubmit
}

describe('ProjectsContentForm', { timeout: 20_000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts clean with Save disabled and no contact fields', { timeout: 20_000 }, () => {
    renderForm(validContent())

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(screen.queryByLabelText(/phone/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/whatsapp/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/facebook/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/address/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/image/i)).not.toBeInTheDocument()
  })

  it('opens Project Cards with six fixed editors', async () => {
    const user = userEvent.setup()
    renderForm(validContent())

    await user.click(screen.getByRole('button', { name: 'Expand Project Cards' }))

    expect(
      screen.getAllByRole('group', { name: /^Project \d+$/ }),
    ).toHaveLength(6)
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
    const title = document.getElementById('projects-hero-title') as HTMLInputElement
    await user.type(title, 'Only a title')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        hero: expect.objectContaining({ title: 'Only a title' }),
        portfolio: expect.objectContaining({ projects: expect.any(Array) }),
        trackRecord: expect.objectContaining({ columns: expect.any(Array) }),
        cta: expect.objectContaining({ body: expect.any(String) }),
      }),
    )
    expect(onSubmit.mock.calls[0]?.[0].portfolio.projects).toHaveLength(6)
    expect(onSubmit.mock.calls[0]?.[0].trackRecord.columns).toHaveLength(3)
  })

  it('submits the complete edited document', async () => {
    const user = userEvent.setup()
    const onSubmit = renderForm(validContent())
    const title = document.getElementById('projects-hero-title') as HTMLInputElement

    await user.clear(title)
    await user.type(title, 'Changed hero title')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        hero: expect.objectContaining({ title: 'Changed hero title' }),
        portfolio: expect.objectContaining({ projects: expect.any(Array) }),
        trackRecord: expect.objectContaining({ columns: expect.any(Array) }),
        cta: expect.objectContaining({ body: expect.any(String) }),
      }),
    )
  })

  it('shows the saving state and disables the submit control', () => {
    renderForm(validContent(), vi.fn(), true)

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
  })
})

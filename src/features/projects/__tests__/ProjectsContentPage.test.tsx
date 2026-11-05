import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

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

vi.mock('../useProjectsContent', () => ({
  useProjectsContent: () => ({
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

import { ProjectsError } from '../errors'
import { ProjectsContentPage } from '../pages/ProjectsContentPage'
import { validContent } from './testData'

function renderPage() {
  render(
    <MemoryRouter>
      <ProjectsContentPage />
    </MemoryRouter>,
  )
}

describe('ProjectsContentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.state.status = 'ready'
    mocks.state.content = validContent()
    mocks.state.exists = true
    mocks.state.error = null
    mocks.state.version = 1
    mocks.save.mockResolvedValue(null)
    mocks.reload.mockResolvedValue(undefined)
  })

  it('shows the page heading and intro', () => {
    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Projects Page Settings' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Hero, project cards, track record, and CTA/),
    ).toBeInTheDocument()
  })

  it('shows the empty state when the document does not exist', () => {
    mocks.state.content = null
    mocks.state.exists = false

    renderPage()

    expect(screen.getByText(/No projects page content exists yet/)).toBeInTheDocument()
  })

  it('shows a read error and retries', async () => {
    const user = userEvent.setup()
    mocks.state.status = 'error'
    mocks.state.content = null
    mocks.state.exists = false
    mocks.state.error = 'Network error. Check your connection and try again.'

    renderPage()

    expect(
      screen.getByText('Network error. Check your connection and try again.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Save changes' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(mocks.reload).toHaveBeenCalledTimes(1)
  })

  it('saves the page and shows a success toast', async () => {
    const user = userEvent.setup()
    renderPage()
    const title = document.getElementById('projects-hero-title') as HTMLInputElement

    await user.clear(title)
    await user.type(title, 'Changed hero title')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1))
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: expect.objectContaining({ title: 'Changed hero title' }),
      }),
      'uid-1',
      expect.anything(),
    )
    expect(await screen.findByText('Successfully saved changes')).toBeInTheDocument()
  })

  it('keeps the form and shows an error toast when saving fails', async () => {
    const user = userEvent.setup()
    mocks.save.mockResolvedValue(new ProjectsError('permission-denied'))
    renderPage()
    const title = document.getElementById('projects-hero-title') as HTMLInputElement

    await user.clear(title)
    await user.type(title, 'Changed hero title')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You do not have permission to change the projects page content. Check that firestore.rules is deployed.',
    )
    expect(screen.getByDisplayValue('Changed hero title')).toBeInTheDocument()
  })
})

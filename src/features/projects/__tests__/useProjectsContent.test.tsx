import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  getProjectsContent: vi.fn(),
  saveProjectsContent: vi.fn(),
}))

vi.mock('../projectsContentService', () => ({
  getProjectsContent: mocks.getProjectsContent,
  saveProjectsContent: mocks.saveProjectsContent,
}))

import { ProjectsError } from '../errors'
import type { ProjectsContent } from '../types'
import { useProjectsContent } from '../useProjectsContent'
import { validContent, validDraft } from './testData'

describe('useProjectsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getProjectsContent.mockResolvedValue({
      content: validContent(),
      exists: true,
    })
    mocks.saveProjectsContent.mockResolvedValue(validContent())
  })

  it('loads the document and exposes it to the form', async () => {
    const { result } = renderHook(() => useProjectsContent())

    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(result.current.exists).toBe(true)
    expect(result.current.content?.hero.title).toBe(
      'Electrical projects we take on',
    )
    expect(result.current.error).toBeNull()
    expect(result.current.version).toBe(1)
  })

  it('reports an absent document without inventing content', async () => {
    mocks.getProjectsContent.mockResolvedValue({ content: null, exists: false })

    const { result } = renderHook(() => useProjectsContent())

    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(result.current.exists).toBe(false)
    expect(result.current.content).toBeNull()
  })

  it('surfaces a read error', async () => {
    mocks.getProjectsContent.mockRejectedValue(new ProjectsError('network'))

    const { result } = renderHook(() => useProjectsContent())

    await waitFor(() => expect(result.current.status).toBe('error'))

    expect(result.current.error).toBe(
      'Network error. Check your connection and try again.',
    )
  })

  it('saves, updates the content, and increments the version', async () => {
    const { result } = renderHook(() => useProjectsContent())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let error: unknown
    await act(async () => {
      error = await result.current.save(validDraft(), 'uid-1', null)
    })

    expect(error).toBeNull()
    expect(mocks.saveProjectsContent).toHaveBeenCalledWith(
      expect.objectContaining({
        hero: expect.objectContaining({ title: 'Electrical projects we take on' }),
      }),
      'uid-1',
      null,
    )
    expect(result.current.status).toBe('ready')
    expect(result.current.exists).toBe(true)
    expect(result.current.version).toBe(2)
  })

  it('keeps the form state and reports a save error', async () => {
    mocks.saveProjectsContent.mockRejectedValue(
      new ProjectsError('permission-denied'),
    )
    const { result } = renderHook(() => useProjectsContent())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let error: unknown
    await act(async () => {
      error = await result.current.save(validDraft(), 'uid-1', null)
    })

    expect(error).toBeInstanceOf(ProjectsError)
    expect((error as ProjectsError).code).toBe('permission-denied')
    expect(result.current.status).toBe('ready')
    expect(result.current.content).not.toBeNull()
  })

  it('blocks a second save while the first is in flight', async () => {
    let resolveSave!: (value: ProjectsContent) => void
    mocks.saveProjectsContent.mockReturnValueOnce(
      new Promise<ProjectsContent>((resolve) => {
        resolveSave = resolve
      }),
    )

    const { result } = renderHook(() => useProjectsContent())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let first!: Promise<null | ProjectsError>
    act(() => {
      first = result.current.save(validDraft(), 'uid-1', null)
    })

    let second: ProjectsError | null = null
    await act(async () => {
      second = await result.current.save(validDraft(), 'uid-1', null)
    })

    expect(second).toMatchObject({
      message: 'A save is already in progress.',
    })
    expect(mocks.saveProjectsContent).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveSave(validContent())
      await first
    })
  })
})

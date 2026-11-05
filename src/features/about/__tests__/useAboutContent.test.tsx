import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  getAboutContent: vi.fn(),
  saveAboutContent: vi.fn(),
}))

vi.mock('../aboutContentService', () => ({
  getAboutContent: mocks.getAboutContent,
  saveAboutContent: mocks.saveAboutContent,
}))

import { AboutError } from '../errors'
import type { AboutContent } from '../types'
import { useAboutContent } from '../useAboutContent'
import { validContent, validDraft } from './testData'

describe('useAboutContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAboutContent.mockResolvedValue({
      content: validContent(),
      exists: true,
    })
    mocks.saveAboutContent.mockResolvedValue(validContent())
  })

  it('loads the document and exposes it to the form', async () => {
    const { result } = renderHook(() => useAboutContent())

    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(result.current.exists).toBe(true)
    expect(result.current.content?.hero.title).toBe(
      'About the engineering practice',
    )
    expect(result.current.error).toBeNull()
    expect(result.current.version).toBe(1)
  })

  it('reports an absent document without inventing content', async () => {
    mocks.getAboutContent.mockResolvedValue({ content: null, exists: false })

    const { result } = renderHook(() => useAboutContent())

    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(result.current.exists).toBe(false)
    expect(result.current.content).toBeNull()
  })

  it('surfaces a read error', async () => {
    mocks.getAboutContent.mockRejectedValue(new AboutError('network'))

    const { result } = renderHook(() => useAboutContent())

    await waitFor(() => expect(result.current.status).toBe('error'))

    expect(result.current.error).toBe(
      'Network error. Check your connection and try again.',
    )
  })

  it('saves, updates the content, and increments the version', async () => {
    const { result } = renderHook(() => useAboutContent())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let error: unknown
    await act(async () => {
      error = await result.current.save(validDraft(), 'uid-1')
    })

    expect(error).toBeNull()
    expect(mocks.saveAboutContent).toHaveBeenCalledWith(
      expect.objectContaining({ pillars: expect.any(Object) }),
      'uid-1',
      expect.objectContaining({ hero: expect.any(Object) }),
    )
    expect(result.current.status).toBe('ready')
    expect(result.current.exists).toBe(true)
    expect(result.current.version).toBe(2)
  })

  it('keeps the form state and reports a save error', async () => {
    mocks.saveAboutContent.mockRejectedValue(
      new AboutError('permission-denied'),
    )
    const { result } = renderHook(() => useAboutContent())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let error: unknown
    await act(async () => {
      error = await result.current.save(validDraft(), 'uid-1')
    })

    expect(error).toBeInstanceOf(AboutError)
    expect((error as AboutError).code).toBe('permission-denied')
    expect(result.current.status).toBe('ready')
    expect(result.current.content).not.toBeNull()
  })

  it('blocks a second save while the first is in flight', async () => {
    let resolveSave!: (value: AboutContent) => void
    mocks.saveAboutContent.mockReturnValueOnce(
      new Promise<AboutContent>((resolve) => {
        resolveSave = resolve
      }),
    )

    const { result } = renderHook(() => useAboutContent())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let first!: Promise<AboutError | null>
    act(() => {
      first = result.current.save(validDraft(), 'uid-1')
    })

    let second: AboutError | null = null
    await act(async () => {
      second = await result.current.save(validDraft(), 'uid-1')
    })

    expect(second).toMatchObject({
      message: 'A save is already in progress.',
    })
    expect(mocks.saveAboutContent).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveSave(validContent())
      await first
    })
  })
})

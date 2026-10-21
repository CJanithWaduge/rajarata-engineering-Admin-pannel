import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  getHomeContent: vi.fn(),
  saveHomeContent: vi.fn(),
}))

vi.mock('../homeContentService', () => ({
  getHomeContent: mocks.getHomeContent,
  saveHomeContent: mocks.saveHomeContent,
}))

import { HomeError } from '../errors'
import type { HomeContent, HomeDraft } from '../types'
import { useHomeContent } from '../useHomeContent'

const DRAFT: HomeDraft = {
  hero: { image: { kind: 'none' }, alt: '' },
  cards: [],
}

const SAVED: HomeContent = {
  hero: {
    url: 'https://firebasestorage.googleapis.com/v0/b/test/o/hero',
    path: 'home/hero',
    alt: 'Hero',
    width: 1600,
    height: 1000,
    size: 1000,
    contentType: 'image/jpeg',
  },
  featuredProjects: [],
  updatedAt: null,
  updatedBy: 'uid-1',
}

describe('useHomeContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getHomeContent.mockResolvedValue({ content: null, exists: false })
  })

  it('loads the document on mount', async () => {
    const { result } = renderHook(() => useHomeContent())

    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(mocks.getHomeContent).toHaveBeenCalledTimes(1)
    expect(result.current.content).toBeNull()
    expect(result.current.exists).toBe(false)
  })

  it('surfaces a read failure without inventing content', async () => {
    mocks.getHomeContent.mockRejectedValue(new HomeError('permission-denied'))

    const { result } = renderHook(() => useHomeContent())

    await waitFor(() => expect(result.current.status).toBe('error'))

    expect(result.current.content).toBeNull()
    expect(result.current.error).toContain('do not have permission')
  })

  it('ignores a second save while the first is still writing', async () => {
    let resolveSave!: (value: HomeContent) => void
    mocks.saveHomeContent.mockImplementation(
      () => new Promise<HomeContent>((resolve) => {
        resolveSave = resolve
      }),
    )

    const { result } = renderHook(() => useHomeContent())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let first!: Promise<HomeError | null>
    let second!: Promise<HomeError | null>

    act(() => {
      first = result.current.save(DRAFT, 'uid-1')
      second = result.current.save(DRAFT, 'uid-1')
    })

    const secondResult = await second

    expect(secondResult).toBeInstanceOf(HomeError)
    expect(mocks.saveHomeContent).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveSave(SAVED)
      await first
    })

    expect(result.current.content).toEqual(SAVED)
    expect(result.current.status).toBe('ready')
  })

  it('returns a mapped error and keeps the form state when the write fails', async () => {
    mocks.saveHomeContent.mockRejectedValue(new HomeError('network'))

    const { result } = renderHook(() => useHomeContent())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let returned: HomeError | null = null
    await act(async () => {
      returned = await result.current.save(DRAFT, 'uid-1')
    })

    expect(returned).toMatchObject({ code: 'network' })
    expect(result.current.status).toBe('ready')
    expect(result.current.error).toContain('Network error')
  })
})

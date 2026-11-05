import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  getServicesContent: vi.fn(),
  saveServicesContent: vi.fn(),
}))

vi.mock('../servicesContentService', () => ({
  getServicesContent: mocks.getServicesContent,
  saveServicesContent: mocks.saveServicesContent,
}))

import { ServicesError } from '../errors'
import type { ServicesContent } from '../types'
import { useServicesContent } from '../useServicesContent'
import { validContent, validValues } from './testData'

describe('useServicesContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getServicesContent.mockResolvedValue({
      content: validContent(),
      exists: true,
    })
    mocks.saveServicesContent.mockResolvedValue(validContent())
  })

  it('loads the document and exposes it to the form', async () => {
    const { result } = renderHook(() => useServicesContent())

    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(result.current.exists).toBe(true)
    expect(result.current.content?.hero.title).toBe('Electrical engineering services')
    expect(result.current.error).toBeNull()
    expect(result.current.version).toBe(1)
  })

  it('reports an absent document without inventing content', async () => {
    mocks.getServicesContent.mockResolvedValue({ content: null, exists: false })

    const { result } = renderHook(() => useServicesContent())

    await waitFor(() => expect(result.current.status).toBe('ready'))

    expect(result.current.exists).toBe(false)
    expect(result.current.content).toBeNull()
  })

  it('surfaces a read error', async () => {
    mocks.getServicesContent.mockRejectedValue(new ServicesError('network'))

    const { result } = renderHook(() => useServicesContent())

    await waitFor(() => expect(result.current.status).toBe('error'))

    expect(result.current.error).toBe(
      'Network error. Check your connection and try again.',
    )
  })

  it('saves, updates the content, and increments the version', async () => {
    const { result } = renderHook(() => useServicesContent())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let error: unknown
    await act(async () => {
      error = await result.current.save(validValues(), 'uid-1')
    })

    expect(error).toBeNull()
    expect(mocks.saveServicesContent).toHaveBeenCalledWith(
      expect.objectContaining({ services: expect.any(Array) }),
      'uid-1',
    )
    expect(result.current.status).toBe('ready')
    expect(result.current.exists).toBe(true)
    expect(result.current.version).toBe(2)
  })

  it('keeps the form state and reports a save error', async () => {
    mocks.saveServicesContent.mockRejectedValue(
      new ServicesError('permission-denied'),
    )
    const { result } = renderHook(() => useServicesContent())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let error: unknown
    await act(async () => {
      error = await result.current.save(validValues(), 'uid-1')
    })

    expect(error).toBeInstanceOf(ServicesError)
    expect((error as ServicesError).code).toBe('permission-denied')
    expect(result.current.status).toBe('ready')
    expect(result.current.content).not.toBeNull()
  })

  it('blocks a second save while the first is in flight', async () => {
    let resolveSave!: (value: ServicesContent) => void
    mocks.saveServicesContent.mockReturnValueOnce(
      new Promise<ServicesContent>((resolve) => {
        resolveSave = resolve
      }),
    )

    const { result } = renderHook(() => useServicesContent())
    await waitFor(() => expect(result.current.status).toBe('ready'))

    let first!: Promise<ServicesError | null>
    act(() => {
      first = result.current.save(validValues(), 'uid-1')
    })

    let second: ServicesError | null = null
    await act(async () => {
      second = await result.current.save(validValues(), 'uid-1')
    })

    expect(second).toMatchObject({
      message: 'A save is already in progress.',
    })
    expect(mocks.saveServicesContent).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveSave(validContent())
      await first
    })
  })
})

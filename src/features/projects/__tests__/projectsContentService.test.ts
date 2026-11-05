import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  class MockTimestamp {
    private readonly date: Date

    constructor(date: Date) {
      this.date = date
    }

    toDate() {
      return this.date
    }
  }

  return {
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    serverTimestamp: vi.fn(() => 'server-ts'),
    MockTimestamp,
  }
})

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ path: 'site/projects' })),
  getDoc: mocks.getDoc,
  setDoc: mocks.setDoc,
  serverTimestamp: mocks.serverTimestamp,
  Timestamp: mocks.MockTimestamp,
}))

vi.mock('../../../lib/firebase', () => ({
  db: {},
}))

import { ProjectsError } from '../errors'
import {
  getProjectsContent,
  saveProjectsContent,
} from '../projectsContentService'
import { validContent, validValues } from './testData'

describe('projectsContentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.setDoc.mockResolvedValue(undefined)
  })

  it('returns null for an absent document without writing', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => false })

    await expect(getProjectsContent()).resolves.toEqual({
      content: null,
      exists: false,
    })
    expect(mocks.setDoc).not.toHaveBeenCalled()
  })

  it('reads a complete document and its audit fields', async () => {
    const content = validContent()
    const updatedAt = new Date('2026-02-03T04:05:06.000Z')
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        ...content,
        updatedAt: new mocks.MockTimestamp(updatedAt),
        updatedBy: 'uid-2',
      }),
    })

    const result = await getProjectsContent()

    expect(result.exists).toBe(true)
    expect(result.content?.hero.title).toBe(content.hero.title)
    expect(result.content?.portfolio.projects).toHaveLength(6)
    expect(result.content?.updatedAt).toEqual(updatedAt)
    expect(result.content?.updatedBy).toBe('uid-2')
  })

  it('refuses a malformed stored document', async () => {
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        ...validValues(),
        portfolio: {
          ...validValues().portfolio,
          projects: validValues().portfolio.projects.slice(0, 5),
        },
      }),
    })

    await expect(getProjectsContent()).rejects.toMatchObject({
      code: 'invalid-document',
    })
  })

  it('writes one full document with only the allowed top-level keys', async () => {
    const values = validValues()
    values.hero.title = '  Updated title  '

    const saved = await saveProjectsContent(values, 'uid-1')

    expect(mocks.setDoc).toHaveBeenCalledTimes(1)
    const payload = mocks.setDoc.mock.calls[0]?.[1] as Record<string, unknown>
    expect(Object.keys(payload).sort()).toEqual([
      'cta',
      'hero',
      'portfolio',
      'trackRecord',
      'updatedAt',
      'updatedBy',
    ])
    expect(payload.updatedAt).toBe('server-ts')
    expect(payload.updatedBy).toBe('uid-1')
    expect((payload.hero as { title: string }).title).toBe('Updated title')
    expect(saved.hero.title).toBe('Updated title')
  })

  it('does not write when the form values are invalid', async () => {
    const values = validValues()
    values.portfolio.projects = values.portfolio.projects.slice(0, 5)

    await expect(saveProjectsContent(values, 'uid-1')).rejects.toMatchObject({
      code: 'validation',
    })
    expect(mocks.setDoc).not.toHaveBeenCalled()
  })

  it('maps a permission failure while keeping the write error code', async () => {
    mocks.setDoc.mockRejectedValue({ code: 'permission-denied' })

    await expect(
      saveProjectsContent(validValues(), 'uid-1'),
    ).rejects.toBeInstanceOf(ProjectsError)
    await expect(
      saveProjectsContent(validValues(), 'uid-1'),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })
})

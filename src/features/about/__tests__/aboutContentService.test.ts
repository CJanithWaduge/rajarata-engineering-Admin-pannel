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
    uploadAboutImage: vi.fn(),
    deleteAboutObject: vi.fn(),
    toInlineAboutImage: vi.fn(),
    MockTimestamp,
  }
})

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ path: 'site/about' })),
  getDocFromServer: mocks.getDoc,
  setDoc: mocks.setDoc,
  serverTimestamp: mocks.serverTimestamp,
  Timestamp: mocks.MockTimestamp,
}))

vi.mock('../../../lib/firebase', () => ({
  db: {},
  storage: {},
}))

vi.mock('../media', () => ({
  uploadAboutImage: mocks.uploadAboutImage,
  deleteAboutObject: mocks.deleteAboutObject,
  toInlineAboutImage: mocks.toInlineAboutImage,
}))

import { AboutError } from '../errors'
import { getAboutContent, saveAboutContent } from '../aboutContentService'
import type { AboutDraft, AboutImage } from '../types'
import {
  validContent,
  validDraft,
  validImage,
  validValues,
} from './testData'

function storedDocument() {
  const content = validContent()
  return {
    hero: {
      eyebrow: content.hero.eyebrow,
      title: content.hero.title,
      intro: content.hero.intro,
      snapshots: content.hero.snapshots,
      overlay: content.hero.overlay,
      image: {
        imageUrl: content.hero.image.url,
        imagePath: content.hero.image.path,
        imageAlt: content.hero.image.alt,
        imageWidth: content.hero.image.width,
        imageHeight: content.hero.image.height,
        imageSize: content.hero.image.size,
        imageContentType: content.hero.image.contentType,
      },
    },
    heritage: content.heritage,
    visionMission: content.visionMission,
    pillars: content.pillars,
    methodology: content.methodology,
    industries: content.industries,
    cta: content.cta,
    updatedAt: new mocks.MockTimestamp(content.updatedAt ?? new Date()),
    updatedBy: content.updatedBy,
  }
}

function newImageSelection() {
  return {
    kind: 'new' as const,
    file: { name: 'hero.jpg', type: 'image/jpeg', size: 1000 } as File,
    previewUrl: 'blob:test',
    width: 1600,
    height: 1000,
    size: 1000,
    contentType: 'image/jpeg' as const,
    originalSize: 1000,
    optimized: false,
  }
}

function draftWithNewImage(): AboutDraft {
  const draft = validDraft()
  return { ...draft, hero: { ...draft.hero, image: newImageSelection() } }
}

describe('aboutContentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.setDoc.mockResolvedValue(undefined)
    mocks.deleteAboutObject.mockResolvedValue(undefined)
    mocks.uploadAboutImage.mockReset()
    mocks.toInlineAboutImage.mockReset()
  })

  it('returns null for an absent document without writing', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => false })

    await expect(getAboutContent()).resolves.toEqual({
      content: null,
      exists: false,
    })
    expect(mocks.setDoc).not.toHaveBeenCalled()
  })

  it('reads a complete document and its audit fields', async () => {
    const updatedAt = new Date('2026-02-03T04:05:06.000Z')
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ ...storedDocument(), updatedAt: new mocks.MockTimestamp(updatedAt) }),
    })

    const result = await getAboutContent()

    expect(result.exists).toBe(true)
    expect(result.content?.hero.title).toBe(validContent().hero.title)
    expect(result.content?.hero.image.path).toBe('about/hero/stored.webp')
    expect(result.content?.pillars.items).toHaveLength(5)
    expect(result.content?.industries.sectors).toHaveLength(6)
    expect(result.content?.updatedAt).toEqual(updatedAt)
    expect(result.content?.updatedBy).toBe('uid-1')
  })

  it('refuses a malformed stored document', async () => {
    const document = storedDocument()
    document.industries.sectors = document.industries.sectors.slice(0, 5)
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => document,
    })

    await expect(getAboutContent()).rejects.toMatchObject({
      code: 'invalid-document',
    })
  })

  it('writes one full document with only the allowed top-level keys', async () => {
    const draft = validDraft()
    draft.hero.title = '  Updated hero title  '

    const saved = await saveAboutContent(draft, 'uid-1', null)

    expect(mocks.uploadAboutImage).not.toHaveBeenCalled()
    expect(mocks.setDoc).toHaveBeenCalledTimes(1)

    const payload = mocks.setDoc.mock.calls[0]?.[1] as Record<string, unknown>
    expect(Object.keys(payload).sort()).toEqual([
      'cta',
      'heritage',
      'hero',
      'industries',
      'methodology',
      'pillars',
      'updatedAt',
      'updatedBy',
      'visionMission',
    ])
    expect(payload.updatedAt).toBe('server-ts')
    expect(payload.updatedBy).toBe('uid-1')

    const hero = payload.hero as {
      title: string
      image: { imageUrl: string; imagePath: string; imageAlt: string }
    }
    expect(hero.title).toBe('Updated hero title')
    expect(hero.image.imagePath).toBe('about/hero/stored.webp')
    expect(hero.image.imageUrl).toBe(validImage().url)
    expect(hero.image.imageAlt).toBe(validValues().hero.alt)
    expect(saved.hero.title).toBe('Updated hero title')
    expect(saved.hero.image.alt).toBe(validValues().hero.alt)
  })

  it('does not write when a text value is over its limit', async () => {
    const draft = validDraft()
    draft.heritage.title = 'x'.repeat(101)

    await expect(saveAboutContent(draft, 'uid-1', null)).rejects.toMatchObject({
      code: 'validation',
    })
    expect(mocks.setDoc).not.toHaveBeenCalled()
    expect(mocks.uploadAboutImage).not.toHaveBeenCalled()
  })

  it('saves blank text and no hero image for the public fallback', async () => {
    const draft: AboutDraft = {
      ...validDraft(),
      hero: {
        ...validDraft().hero,
        title: '',
        alt: '',
        image: { kind: 'none' },
      },
    }

    const saved = await saveAboutContent(draft, 'uid-1', null)

    expect(mocks.setDoc).toHaveBeenCalledTimes(1)
    expect(mocks.uploadAboutImage).not.toHaveBeenCalled()

    const payload = mocks.setDoc.mock.calls[0]?.[1] as {
      hero: {
        title: string
        image: {
          imageUrl: string
          imagePath: string
          imageAlt: string
          imageWidth: number
        }
      }
    }
    expect(payload.hero.title).toBe('')
    expect(payload.hero.image).toEqual({
      imageUrl: '',
      imagePath: '',
      imageAlt: '',
      imageWidth: 0,
      imageHeight: 0,
      imageSize: 0,
      imageContentType: '',
    })
    expect(saved.hero.image.url).toBe('')
    expect(saved.hero.image.alt).toBe('')
  })

  it('rejects a selected hero image without alt text before writing', async () => {
    const draft = validDraft()
    draft.hero.alt = ''

    await expect(saveAboutContent(draft, 'uid-1', null)).rejects.toMatchObject({
      code: 'validation',
      message: 'Hero image alt text is required when a hero image is set.',
    })
    expect(mocks.setDoc).not.toHaveBeenCalled()
    expect(mocks.uploadAboutImage).not.toHaveBeenCalled()
  })

  it('uploads a replaced hero, writes it, and deletes the old object', async () => {
    const previous = validContent()
    const draft = draftWithNewImage()
    const upload: AboutImage = {
      ...validImage(),
      url: 'https://firebasestorage.googleapis.com/v0/b/test/o/about%2Fhero%2Fnew.jpg',
      path: 'about/hero/new.jpg',
      alt: draft.hero.alt,
      contentType: 'image/jpeg',
    }
    mocks.uploadAboutImage.mockResolvedValue(upload)

    const saved = await saveAboutContent(draft, 'uid-1', previous)

    expect(mocks.uploadAboutImage).toHaveBeenCalledTimes(1)
    expect(mocks.setDoc).toHaveBeenCalledTimes(1)
    expect(mocks.deleteAboutObject).toHaveBeenCalledWith('about/hero/stored.webp')

    const payload = mocks.setDoc.mock.calls[0]?.[1] as {
      hero: { image: { imagePath: string; imageAlt: string } }
    }
    expect(payload.hero.image.imagePath).toBe('about/hero/new.jpg')
    expect(payload.hero.image.imageAlt).toBe(draft.hero.alt)
    expect(saved.hero.image.path).toBe('about/hero/new.jpg')
  })

  it('deletes an uploaded object when the write fails', async () => {
    const draft = draftWithNewImage()
    const upload: AboutImage = {
      ...validImage(),
      url: 'https://example.test/new.jpg',
      path: 'about/hero/new.jpg',
    }
    mocks.uploadAboutImage.mockResolvedValue(upload)
    mocks.setDoc.mockRejectedValue({ code: 'permission-denied' })

    await expect(
      saveAboutContent(draft, 'uid-1', validContent()),
    ).rejects.toMatchObject({ code: 'permission-denied' })

    expect(mocks.deleteAboutObject).toHaveBeenCalledWith('about/hero/new.jpg')
  })

  it('maps a permission failure while keeping the write error code', async () => {
    mocks.setDoc.mockRejectedValue({ code: 'permission-denied' })

    await expect(
      saveAboutContent(validDraft(), 'uid-1', null),
    ).rejects.toBeInstanceOf(AboutError)
    await expect(
      saveAboutContent(validDraft(), 'uid-1', null),
    ).rejects.toMatchObject({ code: 'permission-denied' })
  })
})

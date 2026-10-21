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
    uploadHomeImage: vi.fn(),
    deleteHomeObject: vi.fn(),
    MockTimestamp,
  }
})

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ path: 'site/home' })),
  getDoc: mocks.getDoc,
  setDoc: mocks.setDoc,
  serverTimestamp: mocks.serverTimestamp,
  Timestamp: mocks.MockTimestamp,
}))

vi.mock('../../../lib/firebase', () => ({
  db: {},
  storage: {},
}))

vi.mock('../storageService', () => ({
  uploadHomeImage: mocks.uploadHomeImage,
  deleteHomeObject: mocks.deleteHomeObject,
}))

import { getHomeContent, saveHomeContent } from '../homeContentService'
import type { HomeContent, HomeDraft, HomeImage } from '../types'

function image(prefix: string): HomeImage {
  return {
    url: `https://firebasestorage.googleapis.com/v0/b/test/o/${prefix}`,
    path: `home/${prefix}`,
    alt: `Alt ${prefix}`,
    width: 1600,
    height: 1000,
    size: 1000,
    contentType: 'image/jpeg',
  }
}

function docImage(prefix: string) {
  return {
    imageUrl: `https://firebasestorage.googleapis.com/v0/b/test/o/${prefix}`,
    imagePath: `home/${prefix}`,
    imageAlt: `Alt ${prefix}`,
    imageWidth: 1600,
    imageHeight: 1000,
    imageSize: 1000,
    imageContentType: 'image/jpeg',
  }
}

function storedContent(): HomeContent {
  return {
    hero: image('hero-old'),
    featuredProjects: [
      {
        image: image('card-1-old'),
        category: 'Industrial',
        venue: 'Anuradhapura',
        topic: 'Industrial Distribution',
        tag: 'MV / LV',
      },
      {
        image: image('card-2-old'),
        category: 'Commercial',
        venue: 'Anuradhapura',
        topic: 'Commercial Panels',
        tag: 'Panels',
      },
      {
        image: image('card-3-old'),
        category: 'ELV',
        venue: 'Anuradhapura',
        topic: 'ELV Systems',
        tag: 'Automation',
      },
    ],
    updatedAt: null,
    updatedBy: null,
  }
}

function draftFrom(content: HomeContent): HomeDraft {
  return {
    hero: { image: { kind: 'stored', image: content.hero }, alt: content.hero.alt },
    cards: content.featuredProjects.map((project) => ({
      image: { kind: 'stored', image: project.image },
      alt: project.image.alt,
      category: project.category,
      venue: project.venue,
      topic: project.topic,
      tag: project.tag,
    })),
  }
}

function fakeFile(): File {
  return { name: 'new.jpg', type: 'image/jpeg', size: 1000 } as unknown as File
}

function newImageSelection() {
  return {
    kind: 'new' as const,
    file: fakeFile(),
    previewUrl: 'blob:test',
    width: 1600,
    height: 1000,
    size: 1000,
    contentType: 'image/jpeg' as const,
  }
}

describe('getHomeContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when the document does not exist', async () => {
    mocks.getDoc.mockResolvedValue({ exists: () => false })

    await expect(getHomeContent()).resolves.toEqual({ content: null, exists: false })
  })

  it('parses the stored document', async () => {
    const updatedAt = new Date('2026-01-02T03:04:05Z')
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        hero: docImage('hero-old'),
        featuredProjects: [
          {
            ...docImage('card-1-old'),
            category: 'Industrial',
            venue: 'Anuradhapura',
            topic: 'Industrial Distribution',
            tag: 'MV / LV',
          },
          {
            ...docImage('card-2-old'),
            category: 'Commercial',
            venue: 'Anuradhapura',
            topic: 'Commercial Panels',
            tag: 'Panels',
          },
          {
            ...docImage('card-3-old'),
            category: 'ELV',
            venue: 'Anuradhapura',
            topic: 'ELV Systems',
            tag: 'Automation',
          },
        ],
        updatedAt: new mocks.MockTimestamp(updatedAt),
        updatedBy: 'uid-1',
      }),
    })

    const result = await getHomeContent()

    expect(result.exists).toBe(true)
    expect(result.content?.hero.url).toContain('hero-old')
    expect(result.content?.featuredProjects).toHaveLength(3)
    expect(result.content?.updatedAt).toEqual(updatedAt)
    expect(result.content?.updatedBy).toBe('uid-1')
  })

  it('pads a short project array with blank cards', async () => {
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        hero: docImage('hero-old'),
        featuredProjects: [],
        updatedAt: null,
        updatedBy: null,
      }),
    })

    const result = await getHomeContent()

    expect(result.content?.featuredProjects).toHaveLength(3)
    expect(result.content?.featuredProjects[0]?.image.url).toBe('')
  })

  it('maps a permission error to a HomeError', async () => {
    mocks.getDoc.mockRejectedValue({ code: 'permission-denied' })

    await expect(getHomeContent()).rejects.toMatchObject({
      name: 'HomeError',
      code: 'permission-denied',
    })
  })
})

describe('saveHomeContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.setDoc.mockResolvedValue(undefined)
    mocks.deleteHomeObject.mockResolvedValue(undefined)
    mocks.serverTimestamp.mockReturnValue('server-ts')
  })

  it('writes text without uploading when no image changed', async () => {
    const previous = storedContent()
    const draft = draftFrom(previous)
    draft.cards[1] = { ...draft.cards[1], venue: 'Kandy' }

    await saveHomeContent(draft, 'uid-1', previous)

    expect(mocks.uploadHomeImage).not.toHaveBeenCalled()
    expect(mocks.deleteHomeObject).not.toHaveBeenCalled()
    expect(mocks.setDoc).toHaveBeenCalledTimes(1)

    const payload = mocks.setDoc.mock.calls[0]?.[1] as {
      hero: { imageUrl: string; imagePath: string; imageAlt: string }
      featuredProjects: Array<{
        venue: string
        imageUrl: string
        imagePath: string
        image?: unknown
      }>
      updatedBy: string
      updatedAt: string
    }
    expect(payload.hero.imageUrl).toContain('hero-old')
    expect(payload.hero.imagePath).toBe('home/hero-old')
    expect(payload.featuredProjects[0]?.imageUrl).toContain('card-1-old')
    expect(payload.featuredProjects[0]?.imagePath).toBe('home/card-1-old')
    expect(payload.featuredProjects[0]?.image).toBeUndefined()
    expect(payload.featuredProjects[0]?.venue).toBe('Anuradhapura')
    expect(payload.featuredProjects[1]?.venue).toBe('Kandy')
    expect(payload.featuredProjects[2]?.venue).toBe('Anuradhapura')
    expect(payload.updatedBy).toBe('uid-1')
    expect(payload.updatedAt).toBe('server-ts')
  })

  it('writes a flat image shape that the reader can parse back', async () => {
    const previous = storedContent()
    const draft = draftFrom(previous)

    await saveHomeContent(draft, 'uid-1', previous)

    const payload = mocks.setDoc.mock.calls[0]?.[1] as Record<string, unknown>
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ ...payload, updatedAt: new mocks.MockTimestamp(new Date()) }),
    })

    const result = await getHomeContent()

    expect(result.content?.hero.url).toContain('hero-old')
    expect(result.content?.hero.path).toBe('home/hero-old')
    expect(result.content?.featuredProjects[0]?.image.url).toContain('card-1-old')
    expect(result.content?.featuredProjects[0]?.venue).toBe('Anuradhapura')
  })

  it('uploads a replaced hero, writes it, and deletes the old object', async () => {
    const previous = storedContent()
    const draft = draftFrom(previous)
    draft.hero = { image: newImageSelection(), alt: 'New hero' }
    mocks.uploadHomeImage.mockResolvedValue({ ...image('hero-new'), alt: 'New hero' })

    await saveHomeContent(draft, 'uid-1', previous)

    expect(mocks.uploadHomeImage).toHaveBeenCalledTimes(1)
    expect(mocks.setDoc).toHaveBeenCalledTimes(1)
    expect(mocks.deleteHomeObject).toHaveBeenCalledWith('home/hero-old')
    expect(mocks.deleteHomeObject).not.toHaveBeenCalledWith('home/card-1-old')

    const payload = mocks.setDoc.mock.calls[0]?.[1] as {
      hero: { imageUrl: string; imagePath: string; imageAlt: string }
    }
    expect(payload.hero.imagePath).toBe('home/hero-new')
    expect(payload.hero.imageUrl).toContain('hero-new')
    expect(payload.hero.imageAlt).toBe('New hero')
  })

  it('deletes every object uploaded by a failed write', async () => {
    const previous = storedContent()
    const draft = draftFrom(previous)
    draft.hero = { image: newImageSelection(), alt: 'New hero' }
    mocks.uploadHomeImage.mockResolvedValue({ ...image('hero-new'), alt: 'New hero' })
    mocks.setDoc.mockRejectedValue({ code: 'permission-denied' })

    await expect(saveHomeContent(draft, 'uid-1', previous)).rejects.toMatchObject({
      code: 'permission-denied',
    })
    expect(mocks.deleteHomeObject).toHaveBeenCalledWith('home/hero-new')
  })

  it('rejects a missing hero before uploading anything', async () => {
    const previous = storedContent()
    const draft = draftFrom(previous)
    draft.hero = { image: { kind: 'none' }, alt: 'Hero alt' }

    await expect(saveHomeContent(draft, 'uid-1', previous)).rejects.toMatchObject({
      code: 'validation',
    })
    expect(mocks.uploadHomeImage).not.toHaveBeenCalled()
    expect(mocks.setDoc).not.toHaveBeenCalled()
  })

  it('rejects invalid text before uploading anything', async () => {
    const previous = storedContent()
    const draft = draftFrom(previous)
    draft.cards[0] = { ...draft.cards[0], category: '   ' }

    await expect(saveHomeContent(draft, 'uid-1', previous)).rejects.toMatchObject({
      code: 'validation',
    })
    expect(mocks.uploadHomeImage).not.toHaveBeenCalled()
  })

  it('rejects a missing card image', async () => {
    const previous = storedContent()
    const draft = draftFrom(previous)
    draft.cards[2] = { ...draft.cards[2], image: { kind: 'none' } }

    await expect(saveHomeContent(draft, 'uid-1', previous)).rejects.toMatchObject({
      code: 'validation',
    })
    expect(mocks.uploadHomeImage).not.toHaveBeenCalled()
  })
})

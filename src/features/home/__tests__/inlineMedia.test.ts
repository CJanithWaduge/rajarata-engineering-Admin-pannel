import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  uploadHomeImage: vi.fn(),
  deleteHomeObject: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({ path: 'site/home' })),
  getDocFromServer: mocks.getDoc,
  setDoc: mocks.setDoc,
  serverTimestamp: vi.fn(() => 'server-ts'),
  Timestamp: class {
    toDate() {
      return new Date()
    }
  },
}))

vi.mock('../../../lib/firebase', () => ({
  db: {},
  storage: {},
}))

vi.mock('../storageService', () => ({
  uploadHomeImage: mocks.uploadHomeImage,
  deleteHomeObject: mocks.deleteHomeObject,
}))

// Must be set before the service module is imported so mediaMode.ts sees it.
vi.stubEnv('VITE_FIREBASE_INLINE_MEDIA', 'true')

import type { HomeDraft, NewImage } from '../types'

let createEmptyDraft: typeof import('../defaults').createEmptyDraft
let saveHomeContent: typeof import('../homeContentService').saveHomeContent

beforeAll(async () => {
  const defaults = await import('../defaults')
  const service = await import('../homeContentService')
  createEmptyDraft = defaults.createEmptyDraft
  saveHomeContent = service.saveHomeContent
})

function heroFile(): File {
  return new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])], 'hero.jpg', {
    type: 'image/jpeg',
  })
}

function draftWithInlineHero(): HomeDraft {
  const draft = createEmptyDraft()
  const image: NewImage = {
    kind: 'new',
    file: heroFile(),
    previewUrl: 'blob:inline',
    width: 1600,
    height: 1000,
    size: 6,
    contentType: 'image/jpeg',
    originalSize: 6,
    optimized: false,
  }
  draft.hero = { image, alt: 'Inline hero' }
  return draft
}

describe('saveHomeContent in inline media mode', () => {
  beforeEach(() => {
    mocks.setDoc.mockReset().mockResolvedValue(undefined)
    mocks.uploadHomeImage.mockReset()
    mocks.deleteHomeObject.mockReset()
  })

  it('stores the hero as a raster data URL without touching Storage', async () => {
    await saveHomeContent(draftWithInlineHero(), 'uid-1', null)

    expect(mocks.uploadHomeImage).not.toHaveBeenCalled()
    expect(mocks.setDoc).toHaveBeenCalledTimes(1)

    const [ref, payload] = mocks.setDoc.mock.calls[0] as [
      { path: string },
      { hero: { imageUrl: string; imagePath: string; imageAlt: string } },
    ]

    expect(ref.path).toBe('site/home')
    expect(payload.hero.imageUrl).toMatch(/^data:image\/jpeg;base64,/)
    expect(payload.hero.imagePath).toBe('')
    expect(payload.hero.imageAlt).toBe('Inline hero')
    expect(mocks.deleteHomeObject).not.toHaveBeenCalled()
  })
})

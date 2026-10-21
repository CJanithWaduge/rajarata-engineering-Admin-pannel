import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  readImageFile,
  sniffContentType,
  validateImageMetadata,
} from '../imageValidation'

const HERO = {
  name: 'hero.jpg',
  type: 'image/jpeg',
  size: 1024 * 1024,
  width: 1600,
  height: 1000,
}

const CARD = {
  name: 'card.webp',
  type: 'image/webp',
  size: 512 * 1024,
  width: 1600,
  height: 900,
}

function fakeFile(header: number[]): File {
  return new File([new Uint8Array(header)], 'hero.jpg', { type: 'image/jpeg' })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('validateImageMetadata', () => {
  it('accepts a hero image inside every limit', () => {
    expect(validateImageMetadata(HERO, 'hero')).toEqual({
      ok: true,
      metadata: {
        width: 1600,
        height: 1000,
        size: HERO.size,
        contentType: 'image/jpeg',
      },
    })
  })

  it('accepts a card image inside its own limits', () => {
    expect(validateImageMetadata(CARD, 'card').ok).toBe(true)
  })

  it('rejects an unsupported extension', () => {
    const result = validateImageMetadata(
      { ...HERO, name: 'hero.svg', type: 'image/svg+xml' },
      'hero',
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('JPEG, PNG, or WebP')
  })

  it('rejects a MIME type that does not match the extension', () => {
    const result = validateImageMetadata(
      { ...HERO, name: 'hero.jpg', type: 'image/png' },
      'hero',
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('does not match')
  })

  it('rejects a file over the hero byte limit', () => {
    const result = validateImageMetadata(
      { ...HERO, size: 5 * 1024 * 1024 + 1 },
      'hero',
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('5 MB')
  })

  it('rejects a file over the card byte limit', () => {
    const result = validateImageMetadata(
      { ...CARD, size: 3 * 1024 * 1024 + 1 },
      'card',
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('3 MB')
  })

  it('rejects a hero below the minimum dimensions', () => {
    const result = validateImageMetadata(
      { ...HERO, width: 1599, height: 1000 },
      'hero',
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('1600 x 1000')
  })

  it('rejects an image above the maximum dimensions', () => {
    const result = validateImageMetadata(
      { ...HERO, width: 6001, height: 4000 },
      'hero',
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('6000 x 6000')
  })

  it('rejects an aspect ratio outside the allowed range', () => {
    const result = validateImageMetadata(
      { ...HERO, width: 3000, height: 1000 },
      'hero',
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('aspect ratio')
  })

  it('rejects an empty file', () => {
    const result = validateImageMetadata({ ...HERO, size: 0 }, 'hero')
    expect(result.ok).toBe(false)
  })
})

describe('sniffContentType', () => {
  it('detects JPEG', () => {
    expect(sniffContentType(new Uint8Array([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(
      'image/jpeg',
    )
  })

  it('detects PNG', () => {
    expect(
      sniffContentType(
        new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]),
      ),
    ).toBe('image/png')
  })

  it('detects WebP', () => {
    const bytes = new Uint8Array(12)
    bytes.set(new TextEncoder().encode('RIFF'), 0)
    bytes.set(new TextEncoder().encode('WEBP'), 8)
    expect(sniffContentType(bytes)).toBe('image/webp')
  })

  it('returns null for an unknown signature', () => {
    expect(sniffContentType(new Uint8Array([1, 2, 3, 4]))).toBeNull()
  })
})

describe('readImageFile', () => {
  it('returns a preview only after the signature and dimensions pass', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 1600, height: 1000, close: vi.fn() })),
    )

    const result = await readImageFile(
      fakeFile([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      'hero',
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.image.width).toBe(1600)
      expect(result.image.height).toBe(1000)
      expect(result.image.previewUrl).toBe('blob:test')
    }
  })

  it('rejects a file whose signature is not an image', async () => {
    const result = await readImageFile(fakeFile([1, 2, 3, 4, 5, 6, 7, 8]), 'hero')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('not a valid')
  })

  it('rejects a file whose signature disagrees with its MIME type', async () => {
    const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]
    const result = await readImageFile(fakeFile(pngHeader), 'hero')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('do not match')
  })
})

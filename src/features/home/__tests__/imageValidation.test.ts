import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_SOURCE_BYTES } from '../constants'
import {
  readImageFile,
  sniffContentType,
  validateImageMetadata,
} from '../imageValidation'

const compressionMocks = vi.hoisted(() => ({
  compressImage: vi.fn(),
}))

vi.mock('../imageCompression', () => ({
  compressImage: compressionMocks.compressImage,
}))

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

function fileWithSize(
  name: string,
  type: string,
  size: number,
  header: number[],
): File {
  const file = new File([new Uint8Array(header)], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

beforeEach(() => {
  compressionMocks.compressImage.mockReset()
})

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

  it('allows an optimized inline result below the source minimum', () => {
    const result = validateImageMetadata(
      { ...HERO, height: 900 },
      'hero',
      { requireMinimumDimensions: false },
    )
    expect(result.ok).toBe(true)
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

    const file = fakeFile([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    const result = await readImageFile(file, 'hero')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.image.width).toBe(1600)
      expect(result.image.height).toBe(1000)
      expect(result.image.previewUrl).toBe('blob:test')
      expect(result.image.optimized).toBe(false)
      expect(result.image.originalSize).toBe(file.size)
    }
    expect(compressionMocks.compressImage).not.toHaveBeenCalled()
  })

  it('optimizes a photo that is under the byte cap but above the optimization threshold', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:optimized')
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 1600, height: 1000, close: vi.fn() })),
    )

    const optimizedFile = new File([new Uint8Array(1024)], 'hero.jpg', {
      type: 'image/jpeg',
    })
    compressionMocks.compressImage.mockResolvedValue({
      ok: true,
      image: {
        file: optimizedFile,
        width: 1600,
        height: 1000,
        size: 1024,
        contentType: 'image/jpeg',
      },
    })

    const source = fileWithSize(
      'hero.jpg',
      'image/jpeg',
      1024 * 1024,
      [0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    )
    const result = await readImageFile(source, 'hero')

    expect(compressionMocks.compressImage).toHaveBeenCalledTimes(1)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.image.optimized).toBe(true)
      expect(result.image.originalSize).toBe(1024 * 1024)
    }
  })

  it('optimizes a file over the byte limit before returning it', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:optimized')
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 4000, height: 2500, close: vi.fn() })),
    )

    const optimizedFile = new File([new Uint8Array(1024)], 'card.jpg', {
      type: 'image/jpeg',
    })
    compressionMocks.compressImage.mockResolvedValue({
      ok: true,
      image: {
        file: optimizedFile,
        width: 1800,
        height: 1125,
        size: 1024,
        contentType: 'image/jpeg',
      },
    })

    const source = fileWithSize(
      'card.jpg',
      'image/jpeg',
      4 * 1024 * 1024,
      [0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    )
    const result = await readImageFile(source, 'card')

    expect(compressionMocks.compressImage).toHaveBeenCalledWith(source, 'card', {
      width: 4000,
      height: 2500,
    }, 'storage')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.image.file).toBe(optimizedFile)
      expect(result.image.width).toBe(1800)
      expect(result.image.height).toBe(1125)
      expect(result.image.size).toBe(1024)
      expect(result.image.optimized).toBe(true)
      expect(result.image.originalSize).toBe(4 * 1024 * 1024)
      expect(result.image.previewUrl).toBe('blob:optimized')
    }
  })

  it('optimizes a file whose dimensions exceed the limit', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:optimized')
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 4500, height: 3000, close: vi.fn() })),
    )

    const optimizedFile = new File(['optimized'], 'card.jpg', { type: 'image/jpeg' })
    compressionMocks.compressImage.mockResolvedValue({
      ok: true,
      image: {
        file: optimizedFile,
        width: 1800,
        height: 1200,
        size: 2048,
        contentType: 'image/jpeg',
      },
    })

    const result = await readImageFile(
      fakeFile([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      'card',
    )

    expect(compressionMocks.compressImage).toHaveBeenCalledTimes(1)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.image.width).toBe(1800)
      expect(result.image.height).toBe(1200)
      expect(result.image.optimized).toBe(true)
    }
  })

  it('rejects a file above the processing cap before decoding', async () => {
    const source = fileWithSize(
      'hero.jpg',
      'image/jpeg',
      MAX_SOURCE_BYTES + 1,
      [0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    )
    const result = await readImageFile(source, 'hero')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('25 MB')
  })

  it('rejects an image above the source pixel cap', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 10000, height: 7000, close: vi.fn() })),
    )

    const result = await readImageFile(
      fakeFile([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      'hero',
    )

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('60 megapixels')
  })

  it('returns the optimizer error when the file cannot be reduced', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 4000, height: 2500, close: vi.fn() })),
    )
    compressionMocks.compressImage.mockResolvedValue({
      ok: false,
      message: 'The image could not be reduced below 3 MB. Choose a smaller file.',
    })

    const source = fileWithSize(
      'card.jpg',
      'image/jpeg',
      4 * 1024 * 1024,
      [0xff, 0xd8, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    )
    const result = await readImageFile(source, 'card')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toContain('3 MB')
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

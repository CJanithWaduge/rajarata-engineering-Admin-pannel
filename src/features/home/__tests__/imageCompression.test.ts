import { describe, expect, it } from 'vitest'
import { compressionDimensions } from '../imageCompression'

describe('compressionDimensions', () => {
  it('downscales a large card to its ceiling without changing the aspect', () => {
    expect(compressionDimensions(4000, 2500, 'card')).toEqual({
      width: 1800,
      height: 1125,
    })
  })

  it('does not upscale a card that is already small enough', () => {
    expect(compressionDimensions(1000, 700, 'card')).toEqual({
      width: 1000,
      height: 700,
    })
  })

  it('downscales a large hero to its ceiling', () => {
    expect(compressionDimensions(6000, 4000, 'hero')).toEqual({
      width: 2400,
      height: 1600,
    })
  })

  it('keeps a standard 16:9 card at its original size', () => {
    expect(compressionDimensions(1600, 900, 'card')).toEqual({
      width: 1600,
      height: 900,
    })
  })

  it('nudges rounding back inside the maximum aspect ratio', () => {
    const result = compressionDimensions(3999, 2105, 'card')
    expect(result.width / result.height).toBeLessThanOrEqual(1.9)
  })

  it('keeps the original when the minimum is enforced and the box is too small', () => {
    expect(
      compressionDimensions(
        3344,
        1880,
        'hero',
        { maxWidth: 1600, maxHeight: 1200 },
        true,
      ),
    ).toEqual({ width: 3344, height: 1880 })
  })

  it('allows an inline downscale below the source minimum', () => {
    expect(
      compressionDimensions(
        3344,
        1880,
        'hero',
        { maxWidth: 1600, maxHeight: 1200 },
        false,
      ),
    ).toEqual({ width: 1600, height: 900 })
  })
})

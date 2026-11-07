import { describe, expect, it } from 'vitest'
import { compressionDimensions } from '../imageCompression'

describe('compressionDimensions', () => {
  it('downscales a large card to its exact 3:2 ceiling', () => {
    expect(compressionDimensions(3000, 2000, 'card')).toEqual({
      width: 1200,
      height: 800,
    })
  })

  it('keeps a card that is already at its ceiling', () => {
    expect(compressionDimensions(1200, 800, 'card')).toEqual({
      width: 1200,
      height: 800,
    })
  })

  it('downscales a large hero to its exact 16:9 ceiling', () => {
    expect(compressionDimensions(3840, 2160, 'hero')).toEqual({
      width: 1920,
      height: 1080,
    })
  })

  it('keeps a smaller exact 3:2 card at its original size', () => {
    expect(compressionDimensions(900, 600, 'card')).toEqual({
      width: 900,
      height: 600,
    })
  })

  it('clamps a rounding overshoot back to the exact aspect', () => {
    const result = compressionDimensions(3999, 2105, 'card', undefined, false)
    expect(result.width / result.height).toBeCloseTo(1.5, 2)
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

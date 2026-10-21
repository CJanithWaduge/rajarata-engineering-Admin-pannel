import { describe, expect, it } from 'vitest'
import { cardTextSchema, homeTextSchema } from '../schema'

const CARD = {
  alt: 'A technician testing a distribution panel',
  category: 'Industrial',
  venue: 'Anuradhapura, Sri Lanka',
  topic: 'Industrial Power Distribution',
  tag: 'MV / LV',
}

const HOME = {
  heroAlt: 'A technician at an electrical distribution panel',
  cards: [CARD, CARD, CARD],
}

describe('cardTextSchema', () => {
  it('accepts a complete card and trims whitespace', () => {
    const result = cardTextSchema.parse({
      ...CARD,
      category: '  Industrial  ',
    })

    expect(result.category).toBe('Industrial')
  })

  it.each(['alt', 'category', 'venue', 'topic'] as const)(
    'requires %s',
    (field) => {
      const result = cardTextSchema.safeParse({ ...CARD, [field]: '   ' })

      expect(result.success).toBe(false)
    },
  )

  it('allows an empty tag', () => {
    expect(cardTextSchema.safeParse({ ...CARD, tag: '' }).success).toBe(true)
  })

  it('enforces the field limits', () => {
    expect(cardTextSchema.safeParse({ ...CARD, category: 'x'.repeat(41) }).success).toBe(
      false,
    )
    expect(cardTextSchema.safeParse({ ...CARD, venue: 'x'.repeat(81) }).success).toBe(false)
    expect(cardTextSchema.safeParse({ ...CARD, topic: 'x'.repeat(91) }).success).toBe(false)
    expect(cardTextSchema.safeParse({ ...CARD, tag: 'x'.repeat(41) }).success).toBe(false)
    expect(cardTextSchema.safeParse({ ...CARD, alt: 'x'.repeat(161) }).success).toBe(false)
  })
})

describe('homeTextSchema', () => {
  it('requires three cards', () => {
    expect(homeTextSchema.safeParse({ ...HOME, cards: [CARD, CARD] }).success).toBe(false)
    expect(homeTextSchema.safeParse(HOME).success).toBe(true)
  })

  it('requires hero alt text', () => {
    expect(homeTextSchema.safeParse({ ...HOME, heroAlt: ' ' }).success).toBe(false)
  })
})

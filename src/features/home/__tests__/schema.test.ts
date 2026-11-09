import { describe, expect, it } from 'vitest'
import { cardTextSchema, heroTextSchema, homeServiceSchema, homeTextSchema } from '../schema'

const CARD = {
  alt: 'A technician testing a distribution panel',
  category: 'Industrial',
  venue: 'Anuradhapura, Sri Lanka',
  topic: 'Industrial Power Distribution',
  tag: 'MV / LV',
}

const SERVICE = {
  icon: 'home_repair_service',
  title: 'Residential & Commercial Wiring',
  description: 'Complete wiring for homes and offices.',
  href: '/services#service-01',
}

const HOME = {
  heroAlt: 'A technician at an electrical distribution panel',
  cards: [CARD, CARD, CARD],
  services: [SERVICE, SERVICE, SERVICE],
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

describe('homeServiceSchema', () => {
  it('accepts a curated icon or an internet-selected icon', () => {
    expect(homeServiceSchema.safeParse(SERVICE).success).toBe(true)
    expect(
      homeServiceSchema.safeParse({ ...SERVICE, icon: 'material-symbols:camera' })
        .success,
    ).toBe(true)
    expect(
      homeServiceSchema.safeParse({ ...SERVICE, icon: 'material-symbols:camera-outline' })
        .success,
    ).toBe(true)
  })

  it('rejects icon names that are not safe to interpolate into a URL', () => {
    for (const icon of [
      'material-symbols:',
      'material-symbols:Camera',
      'material-symbols:camera.svg',
      'material-symbols:camera?color=red',
      'camera',
    ]) {
      expect(homeServiceSchema.safeParse({ ...SERVICE, icon }).success).toBe(false)
    }
  })
})

describe('homeTextSchema', () => {
  it('requires three cards', () => {
    expect(homeTextSchema.safeParse({ ...HOME, cards: [CARD, CARD] }).success).toBe(false)
    expect(homeTextSchema.safeParse(HOME).success).toBe(true)
  })

  it('requires exactly three service slots', () => {
    expect(
      homeTextSchema.safeParse({ ...HOME, services: [SERVICE, SERVICE] }).success,
    ).toBe(false)
    expect(
      homeTextSchema.safeParse({ ...HOME, services: [SERVICE, SERVICE, SERVICE, SERVICE] })
        .success,
    ).toBe(false)
  })

  it('requires hero alt text', () => {
    expect(homeTextSchema.safeParse({ ...HOME, heroAlt: ' ' }).success).toBe(false)
  })
})

describe('heroTextSchema', () => {
  it('requires and trims the hero alt text', () => {
    expect(heroTextSchema.safeParse({ heroAlt: ' ' }).success).toBe(false)
    expect(heroTextSchema.parse({ heroAlt: '  A technician at a panel  ' }).heroAlt).toBe(
      'A technician at a panel',
    )
  })
})

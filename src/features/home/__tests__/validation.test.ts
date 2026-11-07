import { describe, expect, it } from 'vitest'
import { createEmptyDraft } from '../defaults'
import type { CardDraft, HomeImage, ImageSelection } from '../types'
import { isBlankCard, isBlankHero, validateHomeDraft } from '../validation'

const STORED_IMAGE: HomeImage = {
  url: 'https://firebasestorage.googleapis.com/v0/b/test/o/home/card.jpg',
  path: 'home/projects/1/card.jpg',
  alt: 'A distribution panel',
  width: 1600,
  height: 1000,
  size: 1000,
  contentType: 'image/jpeg',
}

const STORED: ImageSelection = { kind: 'stored', image: STORED_IMAGE }

function completeCard(image: ImageSelection = STORED): CardDraft {
  return {
    image,
    alt: 'A distribution panel',
    category: 'Industrial',
    venue: 'Anuradhapura',
    topic: 'Industrial Distribution',
    tag: '',
  }
}

describe('validateHomeDraft', () => {
  it('treats an untouched draft as blank with no errors', () => {
    const result = validateHomeDraft(createEmptyDraft())

    expect(result.textErrors).toEqual({})
    expect(result.imageErrors).toEqual({})
    expect(result.blankCards).toEqual([true, true, true])
    expect(result.normalized.hero.image.kind).toBe('none')
  })

  it('accepts one complete card while the other slots stay blank', () => {
    const draft = createEmptyDraft()
    draft.cards[1] = completeCard()

    const result = validateHomeDraft(draft)

    expect(result.textErrors).toEqual({})
    expect(result.imageErrors).toEqual({})
    expect(result.blankCards).toEqual([true, false, true])
    expect(result.normalized.cards[1]?.category).toBe('Industrial')
    expect(result.normalized.cards[0]?.image.kind).toBe('none')
  })

  it('accepts a complete project card without an uploaded image', () => {
    const draft = createEmptyDraft()
    draft.cards[0] = { ...completeCard(), image: { kind: 'none' } }

    const result = validateHomeDraft(draft)

    expect(result.textErrors).toEqual({})
    expect(result.imageErrors['card-0']).toBeUndefined()
    expect(result.blankCards[0]).toBe(false)
  })

  it('reports missing required text on a card that has an image', () => {
    const draft = createEmptyDraft()
    draft.cards[0] = { ...completeCard(), category: '   ' }

    const result = validateHomeDraft(draft)

    expect(result.textErrors['cards.0.category']).toBe('Category is required.')
    expect(result.imageErrors['card-0']).toBeUndefined()
  })

  it('reports hero alt text without a hero image', () => {
    const draft = createEmptyDraft()
    draft.hero.alt = 'A technician at a panel'

    const result = validateHomeDraft(draft)

    expect(result.imageErrors.hero).toMatch(/Choose a hero image/)
  })

  it('trims text in the normalized draft', () => {
    const draft = createEmptyDraft()
    draft.cards[0] = { ...completeCard(), category: '  Industrial  ' }
    draft.hero = {
      image: STORED,
      alt: '  A technician at a panel  ',
    }

    const result = validateHomeDraft(draft)

    expect(result.normalized.cards[0]?.category).toBe('Industrial')
    expect(result.normalized.hero.alt).toBe('A technician at a panel')
  })
})

describe('blank helpers', () => {
  it('recognises blank and started sections', () => {
    const draft = createEmptyDraft()

    expect(isBlankHero(draft.hero)).toBe(true)
    expect(isBlankCard(draft.cards[0]!)).toBe(true)

    draft.hero.alt = 'Alt'
    draft.cards[0] = completeCard()

    expect(isBlankHero(draft.hero)).toBe(false)
    expect(isBlankCard(draft.cards[0])).toBe(false)
  })
})

import { cardTextSchema, heroTextSchema } from './schema'
import type { CardDraft, HomeDraft } from './types'

export type HomeDraftValidation = {
  textErrors: Record<string, string>
  imageErrors: Record<string, string>
  blankCards: boolean[]
  normalized: HomeDraft
}

/**
 * A section is blank only when it has no image and no text. Blank sections are
 * written as empty slots so the public site can keep its build-time content for
 * that slot. A section with any content must be complete.
 */
export function isBlankHero(hero: HomeDraft['hero']): boolean {
  return hero.image.kind === 'none' && hero.alt.trim() === ''
}

export function isBlankCard(card: CardDraft): boolean {
  return (
    card.image.kind === 'none' &&
    card.alt.trim() === '' &&
    card.category.trim() === '' &&
    card.venue.trim() === '' &&
    card.topic.trim() === '' &&
    card.tag.trim() === ''
  )
}

export function validateHomeDraft(draft: HomeDraft): HomeDraftValidation {
  const textErrors: Record<string, string> = {}
  const imageErrors: Record<string, string> = {}
  const blankCards = draft.cards.map(isBlankCard)
  const heroBlank = isBlankHero(draft.hero)

  let heroAlt = ''
  if (!heroBlank) {
    const parsed = heroTextSchema.safeParse({ heroAlt: draft.hero.alt })
    if (parsed.success) {
      heroAlt = parsed.data.heroAlt
    } else {
      for (const issue of parsed.error.issues) {
        textErrors.heroAlt = issue.message
      }
      heroAlt = draft.hero.alt.trim()
    }

    if (draft.hero.image.kind === 'none') {
      imageErrors.hero =
        'Choose a hero image, or clear the alt text to keep the current hero.'
    }
  }

  const cards: CardDraft[] = draft.cards.map((card, index) => {
    if (blankCards[index]) {
      return {
        image: { kind: 'none' },
        alt: '',
        category: '',
        venue: '',
        topic: '',
        tag: '',
      }
    }

    const parsed = cardTextSchema.safeParse({
      alt: card.alt,
      category: card.category,
      venue: card.venue,
      topic: card.topic,
      tag: card.tag,
    })

    if (parsed.success) {
      if (card.image.kind === 'none') {
        imageErrors[`card-${index}`] =
          'Choose an image for this card, or clear its fields to leave it blank.'
      }
      return {
        image: card.image,
        ...parsed.data,
      }
    }

    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string') {
        textErrors[`cards.${index}.${field}`] = issue.message
      }
    }

    if (card.image.kind === 'none') {
      imageErrors[`card-${index}`] =
        'Choose an image for this card, or clear its fields to leave it blank.'
    }

    return {
      image: card.image,
      alt: card.alt.trim(),
      category: card.category.trim(),
      venue: card.venue.trim(),
      topic: card.topic.trim(),
      tag: card.tag.trim(),
    }
  })

  return {
    textErrors,
    imageErrors,
    blankCards,
    normalized: {
      hero: {
        image: heroBlank ? { kind: 'none' } : draft.hero.image,
        alt: heroAlt,
      },
      cards,
    },
  }
}

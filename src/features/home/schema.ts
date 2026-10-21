import { z } from 'zod'
import { CARD_COUNT, TEXT_LIMITS } from './constants'

function requiredText(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`)
}

function optionalText(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
}

export const cardTextSchema = z.object({
  alt: requiredText('Image alt text', TEXT_LIMITS.alt),
  category: requiredText('Category', TEXT_LIMITS.category),
  venue: requiredText('Venue', TEXT_LIMITS.venue),
  topic: requiredText('Topic', TEXT_LIMITS.topic),
  tag: optionalText('Tag', TEXT_LIMITS.tag),
})

export const homeTextSchema = z.object({
  heroAlt: requiredText('Hero image alt text', TEXT_LIMITS.alt),
  cards: z
    .array(cardTextSchema)
    .length(CARD_COUNT, `All ${CARD_COUNT} cards must be filled in.`),
})

export type HomeTextValues = z.infer<typeof homeTextSchema>
export type CardTextValues = z.infer<typeof cardTextSchema>

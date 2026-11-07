import { z } from 'zod'
import {
  CARD_COUNT,
  HOME_SERVICE_COUNT,
  HOME_SERVICE_HREFS,
  HOME_SERVICE_ICONS,
  HOME_SERVICE_TEXT_LIMITS,
  TEXT_LIMITS,
} from './constants'

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

export const heroTextSchema = z.object({
  heroAlt: requiredText('Hero image alt text', TEXT_LIMITS.alt),
})

/**
 * A Home service card is entirely optional. An empty string is stored as-is
 * and the public grid keeps its build-time icon, copy, or link for that field.
 */
export const homeServiceSchema = z.object({
  icon: z.union([
    z.literal(''),
    z.enum(HOME_SERVICE_ICONS, { message: 'Choose an icon from the allowed list.' }),
  ]),
  title: optionalText('Service title', HOME_SERVICE_TEXT_LIMITS.title),
  description: optionalText(
    'Service description',
    HOME_SERVICE_TEXT_LIMITS.description,
  ),
  href: z.union([
    z.literal(''),
    z.enum(HOME_SERVICE_HREFS, { message: 'Choose one of the eight service links.' }),
  ]),
})

export const homeTextSchema = z.object({
  heroAlt: requiredText('Hero image alt text', TEXT_LIMITS.alt),
  cards: z
    .array(cardTextSchema)
    .length(CARD_COUNT, `All ${CARD_COUNT} cards must be filled in.`),
  services: z
    .array(homeServiceSchema)
    .length(HOME_SERVICE_COUNT, `All ${HOME_SERVICE_COUNT} service slots are required.`),
})

export type HomeTextValues = z.infer<typeof homeTextSchema>
export type CardTextValues = z.infer<typeof cardTextSchema>
export type HomeServiceTextValues = z.infer<typeof homeServiceSchema>

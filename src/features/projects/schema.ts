import { z } from 'zod'
import {
  PROJECT_CATEGORIES,
  PROJECT_COUNT,
  PROJECT_TEXT_LIMITS,
  TRACK_RECORD_COUNT,
} from './constants'
import type { ProjectsFormValues } from './types'

/**
 * Every editable text field is optional. A blank value is stored as an empty
 * string and the public site keeps the build-time content for that slot; only
 * the maximum length is enforced. Fixed array counts and the category allowlist
 * stay enforced.
 */
function optionalText(label: string, max: number) {
  return z.string().trim().max(max, `${label} must be ${max} characters or fewer.`)
}

const projectSchema = z.object({
  category: z.enum(PROJECT_CATEGORIES, {
    message: 'Choose one of the allowed project categories.',
  }),
  subTag: optionalText('Project sub tag', PROJECT_TEXT_LIMITS.projectSubTag),
  location: optionalText('Project location', PROJECT_TEXT_LIMITS.projectLocation),
  year: optionalText('Project year', PROJECT_TEXT_LIMITS.projectYear),
  typePlaceholder: optionalText('Project type', PROJECT_TEXT_LIMITS.projectType),
  title: optionalText('Project title', PROJECT_TEXT_LIMITS.projectTitle),
  summary: optionalText('Project summary', PROJECT_TEXT_LIMITS.projectSummary),
  ref: optionalText('Project reference', PROJECT_TEXT_LIMITS.projectRef),
  specLabel: optionalText('Scope label', PROJECT_TEXT_LIMITS.projectSpecLabel),
  specValue: optionalText('Scope value', PROJECT_TEXT_LIMITS.projectSpecValue),
  specDetail: optionalText('Scope detail', PROJECT_TEXT_LIMITS.projectSpecDetail),
  alt: optionalText('Card image alt text', PROJECT_TEXT_LIMITS.projectImageAlt),
})

const trackRecordColumnSchema = z.object({
  kicker: optionalText('Track-record kicker', PROJECT_TEXT_LIMITS.trackKicker),
  value: optionalText('Track-record value', PROJECT_TEXT_LIMITS.trackValue),
  description: optionalText(
    'Track-record description',
    PROJECT_TEXT_LIMITS.trackDescription,
  ),
})

export const projectsFormSchema = z.object({
  hero: z.object({
    eyebrow: optionalText('Hero eyebrow', PROJECT_TEXT_LIMITS.heroEyebrow),
    title: optionalText('Hero title', PROJECT_TEXT_LIMITS.heroTitle),
    intro: optionalText('Hero intro', PROJECT_TEXT_LIMITS.heroIntro),
  }),
  portfolio: z.object({
    projects: z
      .array(projectSchema)
      .length(PROJECT_COUNT, `Exactly ${PROJECT_COUNT} projects are required.`),
  }),
  trackRecord: z.object({
    columns: z
      .array(trackRecordColumnSchema)
      .length(
        TRACK_RECORD_COUNT,
        `Exactly ${TRACK_RECORD_COUNT} track-record columns are required.`,
      ),
  }),
  cta: z.object({
    eyebrow: optionalText('CTA eyebrow', PROJECT_TEXT_LIMITS.ctaEyebrow),
    title: optionalText('CTA title', PROJECT_TEXT_LIMITS.ctaTitle),
    body: optionalText('CTA body', PROJECT_TEXT_LIMITS.ctaBody),
  }),
}) satisfies z.ZodType<ProjectsFormValues, ProjectsFormValues>

const emptyStoredImage = {
  imageUrl: '',
  imagePath: '',
  imageAlt: '',
  imageWidth: 0,
  imageHeight: 0,
  imageSize: 0,
  imageContentType: '',
}

/**
 * An empty image URL means "keep the public page image". If an image is
 * present, its alt text cannot be blank, because the public page has no
 * matching fallback for an admin-supplied image.
 */
const storedImageSchema = z
  .object({
    imageUrl: z.string().default(''),
    imagePath: z.string().default(''),
    imageAlt: optionalText(
      'Card image alt text',
      PROJECT_TEXT_LIMITS.projectImageAlt,
    ),
    imageWidth: z.number().nonnegative().default(0),
    imageHeight: z.number().nonnegative().default(0),
    imageSize: z.number().nonnegative().default(0),
    imageContentType: z.string().default(''),
  })
  .superRefine((image, ctx) => {
    if (image.imageUrl.trim() !== '' && image.imageAlt.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['imageAlt'],
        message: 'Card image alt text is required when an image is set.',
      })
    }
  })

/**
 * Stored-document schema. A missing image object (documents written before the
 * image fields existed) is accepted and kept as "empty", which means the
 * public page keeps its build-time image for that slot.
 */
const storedProjectSchema = projectSchema
  .omit({ alt: true })
  .extend({
    image: storedImageSchema.default(emptyStoredImage),
  })

export const projectsContentSchema = z.object({
  hero: z.object({
    eyebrow: optionalText('Hero eyebrow', PROJECT_TEXT_LIMITS.heroEyebrow),
    title: optionalText('Hero title', PROJECT_TEXT_LIMITS.heroTitle),
    intro: optionalText('Hero intro', PROJECT_TEXT_LIMITS.heroIntro),
  }),
  portfolio: z.object({
    projects: z
      .array(storedProjectSchema)
      .length(PROJECT_COUNT, `Exactly ${PROJECT_COUNT} projects are required.`),
  }),
  trackRecord: z.object({
    columns: z
      .array(trackRecordColumnSchema)
      .length(
        TRACK_RECORD_COUNT,
        `Exactly ${TRACK_RECORD_COUNT} track-record columns are required.`,
      ),
  }),
  cta: z.object({
    eyebrow: optionalText('CTA eyebrow', PROJECT_TEXT_LIMITS.ctaEyebrow),
    title: optionalText('CTA title', PROJECT_TEXT_LIMITS.ctaTitle),
    body: optionalText('CTA body', PROJECT_TEXT_LIMITS.ctaBody),
  }),
})

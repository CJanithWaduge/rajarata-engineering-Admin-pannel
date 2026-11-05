import { z } from 'zod'
import {
  ABOUT_ICONS,
  ABOUT_TEXT_LIMITS,
  METHOD_STEP_COUNT,
  MILESTONE_COUNT,
  PILLAR_COUNT,
  SECTOR_COUNT,
  SNAPSHOT_COUNT,
} from './constants'
import type { AboutFormValues } from './types'

/**
 * Every About text field is optional. A blank value is stored as an empty
 * string and the public page keeps its build-time content for that slot; only
 * the maximum length is enforced.
 */
function optionalText(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
}

const iconSchema = z.union([
  z.literal(''),
  z.enum(ABOUT_ICONS, { message: 'Choose an icon from the allowed list.' }),
])

const snapshotSchema = z.object({
  title: optionalText('Snapshot title', ABOUT_TEXT_LIMITS.snapshotTitle),
  description: optionalText(
    'Snapshot description',
    ABOUT_TEXT_LIMITS.snapshotDescription,
  ),
})

const overlaySchema = z.object({
  title: optionalText('Overlay title', ABOUT_TEXT_LIMITS.overlayTitle),
  description: optionalText(
    'Overlay description',
    ABOUT_TEXT_LIMITS.overlayDescription,
  ),
  stage: optionalText('Overlay stage', ABOUT_TEXT_LIMITS.overlayStage),
})

const heroTextSchema = z.object({
  eyebrow: optionalText('Hero eyebrow', ABOUT_TEXT_LIMITS.heroEyebrow),
  title: optionalText('Hero title', ABOUT_TEXT_LIMITS.heroTitle),
  intro: optionalText('Hero intro', ABOUT_TEXT_LIMITS.heroIntro),
  alt: optionalText('Hero image alt text', ABOUT_TEXT_LIMITS.heroAlt),
  snapshots: z
    .array(snapshotSchema)
    .length(SNAPSHOT_COUNT, `Exactly ${SNAPSHOT_COUNT} snapshots are required.`),
  overlay: overlaySchema,
})

const milestoneSchema = z.object({
  kicker: optionalText('Milestone kicker', ABOUT_TEXT_LIMITS.milestoneKicker),
  badge: optionalText('Milestone badge', ABOUT_TEXT_LIMITS.milestoneBadge),
  title: optionalText('Milestone title', ABOUT_TEXT_LIMITS.milestoneTitle),
  description: optionalText(
    'Milestone description',
    ABOUT_TEXT_LIMITS.milestoneDescription,
  ),
})

const heritageSchema = z.object({
  eyebrow: optionalText('Story eyebrow', ABOUT_TEXT_LIMITS.heritageEyebrow),
  title: optionalText('Story title', ABOUT_TEXT_LIMITS.heritageTitle),
  narrative: optionalText('Story narrative', ABOUT_TEXT_LIMITS.heritageNarrative),
  approach: optionalText('Approach paragraph', ABOUT_TEXT_LIMITS.heritageApproach),
  milestones: z
    .array(milestoneSchema)
    .length(MILESTONE_COUNT, `Exactly ${MILESTONE_COUNT} milestones are required.`),
})

const visionCardSchema = z.object({
  eyebrow: optionalText('Vision eyebrow', ABOUT_TEXT_LIMITS.visionEyebrow),
  title: optionalText('Vision title', ABOUT_TEXT_LIMITS.visionTitle),
  body: optionalText('Vision body', ABOUT_TEXT_LIMITS.visionBody),
  footer: optionalText('Vision footer', ABOUT_TEXT_LIMITS.visionFooter),
})

const visionMissionSchema = z.object({
  vision: visionCardSchema,
  mission: visionCardSchema,
})

const pillarSchema = z.object({
  icon: iconSchema,
  title: optionalText('Pillar title', ABOUT_TEXT_LIMITS.pillarTitle),
  description: optionalText(
    'Pillar description',
    ABOUT_TEXT_LIMITS.pillarDescription,
  ),
  footer: optionalText('Pillar footer', ABOUT_TEXT_LIMITS.pillarFooter),
})

const pillarsSchema = z.object({
  eyebrow: optionalText('Pillars eyebrow', ABOUT_TEXT_LIMITS.pillarsEyebrow),
  title: optionalText('Pillars title', ABOUT_TEXT_LIMITS.pillarsTitle),
  intro: optionalText('Pillars intro', ABOUT_TEXT_LIMITS.pillarsIntro),
  items: z
    .array(pillarSchema)
    .length(PILLAR_COUNT, `Exactly ${PILLAR_COUNT} pillars are required.`),
})

const methodStepSchema = z.object({
  icon: iconSchema,
  title: optionalText('Step title', ABOUT_TEXT_LIMITS.methodStepTitle),
  description: optionalText(
    'Step description',
    ABOUT_TEXT_LIMITS.methodStepDescription,
  ),
  footer: optionalText('Step footer', ABOUT_TEXT_LIMITS.methodStepFooter),
})

const methodologySchema = z.object({
  eyebrow: optionalText(
    'Methodology eyebrow',
    ABOUT_TEXT_LIMITS.methodologyEyebrow,
  ),
  title: optionalText('Methodology title', ABOUT_TEXT_LIMITS.methodologyTitle),
  intro: optionalText('Methodology intro', ABOUT_TEXT_LIMITS.methodologyIntro),
  steps: z
    .array(methodStepSchema)
    .length(
      METHOD_STEP_COUNT,
      `Exactly ${METHOD_STEP_COUNT} method steps are required.`,
    ),
})

const sectorSchema = z.object({
  icon: iconSchema,
  title: optionalText('Sector title', ABOUT_TEXT_LIMITS.sectorTitle),
  description: optionalText(
    'Sector description',
    ABOUT_TEXT_LIMITS.sectorDescription,
  ),
})

const industriesSchema = z.object({
  eyebrow: optionalText('Industries eyebrow', ABOUT_TEXT_LIMITS.industriesEyebrow),
  title: optionalText('Industries title', ABOUT_TEXT_LIMITS.industriesTitle),
  intro: optionalText('Industries intro', ABOUT_TEXT_LIMITS.industriesIntro),
  sectors: z
    .array(sectorSchema)
    .length(SECTOR_COUNT, `Exactly ${SECTOR_COUNT} sectors are required.`),
})

const ctaSchema = z.object({
  eyebrow: optionalText('CTA eyebrow', ABOUT_TEXT_LIMITS.ctaEyebrow),
  title: optionalText('CTA title', ABOUT_TEXT_LIMITS.ctaTitle),
  body: optionalText('CTA body', ABOUT_TEXT_LIMITS.ctaBody),
})

/** Text form schema. The hero image is validated and resolved separately. */
export const aboutFormSchema = z.object({
  hero: heroTextSchema,
  heritage: heritageSchema,
  visionMission: visionMissionSchema,
  pillars: pillarsSchema,
  methodology: methodologySchema,
  industries: industriesSchema,
  cta: ctaSchema,
}) satisfies z.ZodType<AboutFormValues, AboutFormValues>

const storedImageSchema = z
  .object({
    imageUrl: z.string().default(''),
    imagePath: z.string().default(''),
    imageAlt: optionalText('Hero image alt text', ABOUT_TEXT_LIMITS.heroAlt),
    imageWidth: z.number().nonnegative().default(0),
    imageHeight: z.number().nonnegative().default(0),
    imageSize: z.number().nonnegative().default(0),
    imageContentType: z.string().default(''),
  })
  .superRefine((image, ctx) => {
    // An empty image URL means "keep the public hero". If an image is present,
    // its alt text cannot be blank, because the public page has no matching
    // fallback for an admin-supplied image.
    if (image.imageUrl.trim() !== '' && image.imageAlt.trim() === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['imageAlt'],
        message: 'Hero image alt text is required when a hero image is set.',
      })
    }
  })

/**
 * Stored-document schema. Blank text, a blank icon, and an empty hero image are
 * valid: they mean the public page keeps its build-time content for that slot.
 * Fixed array counts are still enforced. A document that fails this is
 * hand-edited or older than the current form, so the panel refuses it rather
 * than inventing any missing copy.
 */
export const aboutContentSchema = z.object({
  hero: z.object({
    eyebrow: optionalText('Hero eyebrow', ABOUT_TEXT_LIMITS.heroEyebrow),
    title: optionalText('Hero title', ABOUT_TEXT_LIMITS.heroTitle),
    intro: optionalText('Hero intro', ABOUT_TEXT_LIMITS.heroIntro),
    image: storedImageSchema,
    snapshots: z.array(snapshotSchema).length(SNAPSHOT_COUNT),
    overlay: overlaySchema,
  }),
  heritage: heritageSchema,
  visionMission: visionMissionSchema,
  pillars: pillarsSchema,
  methodology: methodologySchema,
  industries: industriesSchema,
  cta: ctaSchema,
})

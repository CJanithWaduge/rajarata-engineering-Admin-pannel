import { z } from 'zod'
import {
  CTA_POINT_COUNT,
  METRIC_COUNT,
  PROCESS_STEP_COUNT,
  QUICK_LINK_COUNT,
  SERVICE_ANCHORS,
  SERVICE_COUNT,
  SERVICE_ICONS,
  SERVICES_TEXT_LIMITS,
  SUITABLE_FOR_COUNT,
} from './constants'
import type { ServicesFormValues } from './types'

/**
 * Every editable text field is optional. A blank value is stored as an empty
 * string and the public site keeps the build-time copy for that slot, exactly
 * like the About content. Fixed array counts and the categorical fields
 * (icons, anchors) stay enforced.
 */
function optionalText(label: string, max: number) {
  return z.string().trim().max(max, `${label} must be ${max} characters or fewer.`)
}

const iconSchema = z.enum(SERVICE_ICONS, {
  message: 'Choose an icon from the allowed list.',
})
const anchorSchema = z.enum(SERVICE_ANCHORS, {
  message: 'Choose one of the eight service anchors.',
})

const quickLinkSchema = z.object({
  label: optionalText('Quick link label', SERVICES_TEXT_LIMITS.quickLinkLabel),
  icon: iconSchema,
  target: anchorSchema,
})

const metricSchema = z.object({
  kicker: optionalText('Metric kicker', SERVICES_TEXT_LIMITS.metricKicker),
  title: optionalText('Metric title', SERVICES_TEXT_LIMITS.metricTitle),
  description: optionalText(
    'Metric description',
    SERVICES_TEXT_LIMITS.metricDescription,
  ),
})

const serviceSchema = z.object({
  icon: iconSchema,
  category: optionalText(
    'Service category',
    SERVICES_TEXT_LIMITS.serviceCategory,
  ),
  title: optionalText('Service title', SERVICES_TEXT_LIMITS.serviceTitle),
  description: optionalText(
    'Service description',
    SERVICES_TEXT_LIMITS.serviceDescription,
  ),
  scope: optionalText('Service scope', SERVICES_TEXT_LIMITS.serviceScope),
  suitableFor: z
    .array(optionalText('Suitable-for item', SERVICES_TEXT_LIMITS.suitableFor))
    .length(
      SUITABLE_FOR_COUNT,
      `Each service needs exactly ${SUITABLE_FOR_COUNT} suitable-for items.`,
    ),
})

const processStepSchema = z.object({
  title: optionalText('Step title', SERVICES_TEXT_LIMITS.processStepTitle),
  description: optionalText(
    'Step description',
    SERVICES_TEXT_LIMITS.processStepDescription,
  ),
  mobileDescription: z
    .string()
    .trim()
    .max(
      SERVICES_TEXT_LIMITS.processStepMobileDescription,
      `Mobile description must be ${SERVICES_TEXT_LIMITS.processStepMobileDescription} characters or fewer.`,
    ),
})

export const servicesFormSchema = z.object({
  hero: z.object({
    eyebrow: optionalText('Hero eyebrow', SERVICES_TEXT_LIMITS.heroEyebrow),
    title: optionalText('Hero title', SERVICES_TEXT_LIMITS.heroTitle),
    intro: optionalText('Hero intro', SERVICES_TEXT_LIMITS.heroIntro),
    quickLinks: z
      .array(quickLinkSchema)
      .length(QUICK_LINK_COUNT, `Exactly ${QUICK_LINK_COUNT} quick links are required.`),
    metrics: z
      .array(metricSchema)
      .length(METRIC_COUNT, `Exactly ${METRIC_COUNT} metrics are required.`),
  }),
  directory: z.object({
    eyebrow: optionalText(
      'Directory eyebrow',
      SERVICES_TEXT_LIMITS.directoryEyebrow,
    ),
    title: optionalText('Directory title', SERVICES_TEXT_LIMITS.directoryTitle),
    intro: optionalText('Directory intro', SERVICES_TEXT_LIMITS.directoryIntro),
  }),
  services: z
    .array(serviceSchema)
    .length(SERVICE_COUNT, `Exactly ${SERVICE_COUNT} services are required.`),
  process: z.object({
    eyebrow: optionalText(
      'Process eyebrow',
      SERVICES_TEXT_LIMITS.processEyebrow,
    ),
    title: optionalText('Process title', SERVICES_TEXT_LIMITS.processTitle),
    intro: optionalText('Process intro', SERVICES_TEXT_LIMITS.processIntro),
    steps: z
      .array(processStepSchema)
      .length(
        PROCESS_STEP_COUNT,
        `Exactly ${PROCESS_STEP_COUNT} process steps are required.`,
      ),
  }),
  cta: z.object({
    eyebrow: optionalText('CTA eyebrow', SERVICES_TEXT_LIMITS.ctaEyebrow),
    title: optionalText('CTA title', SERVICES_TEXT_LIMITS.ctaTitle),
    body: optionalText('CTA body', SERVICES_TEXT_LIMITS.ctaBody),
    points: z
      .array(optionalText('CTA point', SERVICES_TEXT_LIMITS.ctaPoint))
      .length(CTA_POINT_COUNT, `Exactly ${CTA_POINT_COUNT} CTA points are required.`),
  }),
}) satisfies z.ZodType<ServicesFormValues, ServicesFormValues>

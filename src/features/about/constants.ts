import { IMAGE_RULES } from '../home/constants'

export const SNAPSHOT_COUNT = 3
export const MILESTONE_COUNT = 4
export const PILLAR_COUNT = 5
export const METHOD_STEP_COUNT = 5
export const SECTOR_COUNT = 6

/**
 * Material Symbols names accepted by the admin form and the public site.
 * The public About page uses these for the pillar, methodology, and industry
 * cards; the hero overlay and "Based In" icons stay fixed in the markup.
 */
export const ABOUT_ICONS = [
  'health_and_safety',
  'precision_manufacturing',
  'balance',
  'schedule',
  'trending_up',
  'manage_search',
  'architecture',
  'handyman',
  'fact_check',
  'contact_support',
  'storefront',
  'apartment',
  'hotel',
  'warehouse',
  'local_hospital',
  'domain_verification',
] as const

export type AboutIconName = (typeof ABOUT_ICONS)[number]

/**
 * Empty string is a valid choice: the public site keeps its built-in icon for
 * that slot. It is listed first so a new document does not silently overwrite
 * any public artwork with an arbitrary icon.
 */
export type AboutIcon = '' | AboutIconName

/** UI labels only; these are not site copy. */
export const ABOUT_ICON_OPTIONS = [
  { value: '', label: 'Use public page default' },
  ...ABOUT_ICONS.map((value) => ({
    value,
    label: value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
  })),
]

/**
 * UI hint for an optional text field. A blank value is not an error: it tells
 * the public site to keep the content it already renders for that slot.
 */
export function aboutTextHint(max: number): string {
  return `Optional · up to ${max} characters. Blank keeps the public page value.`
}

export const ABOUT_TEXT_LIMITS = {
  heroEyebrow: 48,
  heroTitle: 100,
  heroIntro: 600,
  heroAlt: 160,
  snapshotTitle: 32,
  snapshotDescription: 100,
  overlayTitle: 60,
  overlayDescription: 120,
  overlayStage: 40,
  heritageEyebrow: 48,
  heritageTitle: 100,
  heritageNarrative: 900,
  heritageApproach: 300,
  milestoneKicker: 40,
  milestoneBadge: 24,
  milestoneTitle: 80,
  milestoneDescription: 300,
  visionEyebrow: 40,
  visionTitle: 60,
  visionBody: 600,
  visionFooter: 80,
  pillarsEyebrow: 48,
  pillarsTitle: 100,
  pillarsIntro: 400,
  pillarTitle: 40,
  pillarDescription: 240,
  pillarFooter: 60,
  methodologyEyebrow: 48,
  methodologyTitle: 100,
  methodologyIntro: 400,
  methodStepTitle: 40,
  methodStepDescription: 300,
  methodStepFooter: 40,
  industriesEyebrow: 48,
  industriesTitle: 100,
  industriesIntro: 400,
  sectorTitle: 60,
  sectorDescription: 240,
  ctaEyebrow: 48,
  ctaTitle: 100,
  ctaBody: 600,
} as const

/**
 * One inline hero image leaves plenty of room below Firestore's 1 MiB
 * document limit, but the cap is enforced so a future change to the image
 * pipeline cannot silently write an oversized document.
 */
export const ABOUT_INLINE_MEDIA_DOC_BUDGET = 900_000

/** Storage folder for the About hero image (mirrored in `storage.rules`). */
export const ABOUT_STORAGE_ROOT = 'about/hero'

/** Reuses the Home hero image limits so both panels share one gate. */
export const ABOUT_IMAGE_RULE = IMAGE_RULES.hero

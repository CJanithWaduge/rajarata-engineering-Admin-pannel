export const PROJECT_COUNT = 6
export const TRACK_RECORD_COUNT = 3
export const CTA_POINT_COUNT = 2

/**
 * Project categories the public portfolio filters on. Kept in one allowlist so
 * the admin form and the public site can never drift apart silently.
 */
export const PROJECT_CATEGORIES = [
  'residential',
  'commercial',
  'industrial',
  'elv',
  'maintenance',
] as const

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]

/** UI labels only; these are not site copy. */
export const PROJECT_CATEGORY_OPTIONS = PROJECT_CATEGORIES.map((value) => ({
  value,
  label: value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' '),
}))

/** Mirrors the text ceilings the public parser enforces. */
export const PROJECT_TEXT_LIMITS = {
  heroEyebrow: 48,
  heroTitle: 100,
  heroIntro: 600,
  projectSubTag: 60,
  projectLocation: 60,
  projectYear: 20,
  projectType: 60,
  projectTitle: 100,
  projectSummary: 320,
  projectRef: 80,
  projectSpecLabel: 60,
  projectSpecValue: 80,
  projectSpecDetail: 600,
  trackKicker: 60,
  trackValue: 20,
  trackDescription: 300,
  ctaEyebrow: 48,
  ctaTitle: 100,
  ctaBody: 600,
} as const

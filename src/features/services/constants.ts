export const SERVICE_COUNT = 8
export const QUICK_LINK_COUNT = 4
export const METRIC_COUNT = 4
export const PROCESS_STEP_COUNT = 6
export const CTA_POINT_COUNT = 2
export const SUITABLE_FOR_COUNT = 4

/** Material Symbols names accepted by the admin form and the public site. */
export const SERVICE_ICONS = [
  'apartment',
  'precision_manufacturing',
  'developer_board',
  'linear_scale',
  'fact_check',
  'build',
  'router',
  'bolt',
  'factory',
  'settings_ethernet',
] as const

export type ServiceIcon = (typeof SERVICE_ICONS)[number]

/** UI labels only; these are not site copy. */
export const SERVICE_ICON_OPTIONS = SERVICE_ICONS.map((value) => ({
  value,
  label: value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' '),
}))

export const SERVICE_ANCHORS = [
  'service-01',
  'service-02',
  'service-03',
  'service-04',
  'service-05',
  'service-06',
  'service-07',
  'service-08',
] as const

export type ServiceAnchor = (typeof SERVICE_ANCHORS)[number]

export const SERVICE_ANCHOR_OPTIONS = SERVICE_ANCHORS.map((value) => ({
  value,
  label: `Service ${Number(value.slice(-2))}`,
}))

export const SERVICES_TEXT_LIMITS = {
  heroEyebrow: 48,
  heroTitle: 100,
  heroIntro: 600,
  quickLinkLabel: 40,
  metricKicker: 24,
  metricTitle: 32,
  metricDescription: 100,
  directoryEyebrow: 48,
  directoryTitle: 100,
  directoryIntro: 600,
  serviceCategory: 40,
  serviceTitle: 80,
  serviceDescription: 320,
  serviceScope: 500,
  suitableFor: 40,
  processEyebrow: 48,
  processTitle: 100,
  processIntro: 600,
  processStepTitle: 60,
  processStepDescription: 300,
  processStepMobileDescription: 300,
  ctaEyebrow: 48,
  ctaTitle: 100,
  ctaBody: 600,
  ctaPoint: 80,
} as const

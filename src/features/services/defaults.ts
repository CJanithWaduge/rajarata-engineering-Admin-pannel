import {
  CTA_POINT_COUNT,
  METRIC_COUNT,
  PROCESS_STEP_COUNT,
  QUICK_LINK_COUNT,
  SERVICE_ANCHORS,
  SERVICE_COUNT,
  SERVICE_ICONS,
  SUITABLE_FOR_COUNT,
} from './constants'
import type {
  HeroMetric,
  ProcessStep,
  QuickLink,
  ServiceCardContent,
  ServicesContent,
  ServicesFormValues,
} from './types'

export function createEmptyQuickLink(index: number): QuickLink {
  return {
    label: '',
    icon: SERVICE_ICONS[0],
    target: SERVICE_ANCHORS[index] ?? SERVICE_ANCHORS[0],
  }
}

export function createEmptyMetric(): HeroMetric {
  return { kicker: '', title: '', description: '' }
}

export function createEmptyService(): ServiceCardContent {
  return {
    icon: SERVICE_ICONS[0],
    category: '',
    title: '',
    description: '',
    scope: '',
    suitableFor: Array.from({ length: SUITABLE_FOR_COUNT }, () => ''),
  }
}

export function createEmptyStep(): ProcessStep {
  return { title: '', description: '', mobileDescription: '' }
}

/** Empty form state only. No site copy or seed values live here. */
export function createEmptyServicesValues(): ServicesFormValues {
  return {
    hero: {
      eyebrow: '',
      title: '',
      intro: '',
      quickLinks: Array.from({ length: QUICK_LINK_COUNT }, (_, index) =>
        createEmptyQuickLink(index),
      ),
      metrics: Array.from({ length: METRIC_COUNT }, createEmptyMetric),
    },
    directory: { eyebrow: '', title: '', intro: '' },
    services: Array.from({ length: SERVICE_COUNT }, createEmptyService),
    process: {
      eyebrow: '',
      title: '',
      intro: '',
      steps: Array.from({ length: PROCESS_STEP_COUNT }, createEmptyStep),
    },
    cta: {
      eyebrow: '',
      title: '',
      body: '',
      points: Array.from({ length: CTA_POINT_COUNT }, () => ''),
    },
  }
}

function pad<T>(items: T[] | undefined, length: number, create: () => T): T[] {
  return Array.from({ length }, (_, index) => items?.[index] ?? create())
}

/**
 * Copies stored content into fresh form state. Fixed arrays are padded with
 * blank slots, never content, so an older document cannot invent copy.
 */
export function valuesFromContent(
  content: ServicesContent | null,
): ServicesFormValues {
  if (!content) return createEmptyServicesValues()

  return {
    hero: {
      eyebrow: content.hero.eyebrow,
      title: content.hero.title,
      intro: content.hero.intro,
      quickLinks: pad(
        content.hero.quickLinks,
        QUICK_LINK_COUNT,
        () => createEmptyQuickLink(0),
      ).map((link, index) => ({
        ...link,
        target: link.target ?? SERVICE_ANCHORS[index] ?? SERVICE_ANCHORS[0],
      })),
      metrics: pad(content.hero.metrics, METRIC_COUNT, createEmptyMetric).map(
        (metric) => ({ ...metric }),
      ),
    },
    directory: { ...content.directory },
    services: pad(content.services, SERVICE_COUNT, createEmptyService).map(
      (service) => ({
        ...service,
        suitableFor: pad(
          service.suitableFor,
          SUITABLE_FOR_COUNT,
          () => '',
        ),
      }),
    ),
    process: {
      eyebrow: content.process.eyebrow,
      title: content.process.title,
      intro: content.process.intro,
      steps: pad(content.process.steps, PROCESS_STEP_COUNT, createEmptyStep).map(
        (step) => ({ ...step }),
      ),
    },
    cta: {
      eyebrow: content.cta.eyebrow,
      title: content.cta.title,
      body: content.cta.body,
      points: pad(content.cta.points, CTA_POINT_COUNT, () => ''),
    },
  }
}

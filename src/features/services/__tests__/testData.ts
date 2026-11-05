import {
  CTA_POINT_COUNT,
  METRIC_COUNT,
  PROCESS_STEP_COUNT,
  QUICK_LINK_COUNT,
  SERVICE_ANCHORS,
  SERVICE_COUNT,
  SERVICE_ICONS,
  SUITABLE_FOR_COUNT,
} from '../constants'
import { createEmptyServicesValues } from '../defaults'
import type { ServicesContent, ServicesFormValues } from '../types'

function icon(index: number) {
  return SERVICE_ICONS[index % SERVICE_ICONS.length] ?? SERVICE_ICONS[0]
}

function anchor(index: number) {
  return SERVICE_ANCHORS[index % SERVICE_ANCHORS.length] ?? SERVICE_ANCHORS[0]
}

/** Generic test values only; never imported by production code. */
export function validValues(): ServicesFormValues {
  const values = createEmptyServicesValues()

  values.hero = {
    eyebrow: 'Engineering services',
    title: 'Electrical engineering services',
    intro: 'A complete electrical scope for every project.',
    quickLinks: Array.from({ length: QUICK_LINK_COUNT }, (_, index) => ({
      label: `Quick link ${index + 1}`,
      icon: icon(index),
      target: anchor(index),
    })),
    metrics: Array.from({ length: METRIC_COUNT }, (_, index) => ({
      kicker: `Metric ${index + 1}`,
      title: `Metric title ${index + 1}`,
      description: `Metric description ${index + 1}`,
    })),
  }

  values.directory = {
    eyebrow: 'Directory',
    title: 'Complete capabilities',
    intro: 'Every service we deliver.',
  }

  values.services = Array.from({ length: SERVICE_COUNT }, (_, index) => ({
    icon: icon(index),
    category: `Category ${index + 1}`,
    title: `Service ${index + 1}`,
    description: `Service description ${index + 1}`,
    scope: `Service scope ${index + 1}`,
    suitableFor: Array.from(
      { length: SUITABLE_FOR_COUNT },
      (_, chipIndex) => `Chip ${index + 1}.${chipIndex + 1}`,
    ),
  }))

  values.process = {
    eyebrow: 'Process',
    title: 'How we deliver',
    intro: 'Six delivery phases.',
    steps: Array.from({ length: PROCESS_STEP_COUNT }, (_, index) => ({
      title: `Step ${index + 1}`,
      description: `Desktop step description ${index + 1}`,
      mobileDescription: '',
    })),
  }

  values.cta = {
    eyebrow: 'Talk to us',
    title: 'Need a custom solution?',
    body: 'Tell us about the project.',
    points: Array.from(
      { length: CTA_POINT_COUNT },
      (_, index) => `CTA point ${index + 1}`,
    ),
  }

  return values
}

export function validContent(): ServicesContent {
  return {
    ...validValues(),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedBy: 'uid-1',
  }
}

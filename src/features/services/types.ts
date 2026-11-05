import type { ServiceAnchor, ServiceIcon } from './constants'

export type QuickLink = {
  label: string
  icon: ServiceIcon
  target: ServiceAnchor
}

export type HeroMetric = {
  kicker: string
  title: string
  description: string
}

export type ServiceCardContent = {
  icon: ServiceIcon
  category: string
  title: string
  description: string
  scope: string
  suitableFor: string[]
}

export type ProcessStep = {
  title: string
  description: string
  /** Optional mobile-only copy. An empty string falls back to `description`. */
  mobileDescription: string
}

export type ServicesFormValues = {
  hero: {
    eyebrow: string
    title: string
    intro: string
    quickLinks: QuickLink[]
    metrics: HeroMetric[]
  }
  directory: {
    eyebrow: string
    title: string
    intro: string
  }
  services: ServiceCardContent[]
  process: {
    eyebrow: string
    title: string
    intro: string
    steps: ProcessStep[]
  }
  cta: {
    eyebrow: string
    title: string
    body: string
    points: string[]
  }
}

export type ServicesContent = ServicesFormValues & {
  updatedAt: Date | null
  updatedBy: string | null
}

export type ServicesStatus = 'loading' | 'ready' | 'saving' | 'error'

export type ServicesErrorCode =
  | 'permission-denied'
  | 'not-ready'
  | 'network'
  | 'validation'
  | 'invalid-document'
  | 'unknown'

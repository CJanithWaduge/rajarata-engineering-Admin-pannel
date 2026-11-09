import type { AboutIcon } from './constants'

export type ImageContentType = 'image/jpeg' | 'image/png' | 'image/webp'

/** One stored raster image plus the metadata the document keeps. */
export type AboutImage = {
  url: string
  path: string
  alt: string
  width: number
  height: number
  size: number
  contentType: string
}

export type AboutSnapshot = {
  title: string
  description: string
}

export type AboutOverlay = {
  title: string
  description: string
  stage: string
  stageLabel: string
}

export type AboutMilestone = {
  kicker: string
  badge: string
  title: string
  description: string
}

export type AboutVisionCard = {
  eyebrow: string
  title: string
  body: string
  footer: string
}

export type AboutPillar = {
  icon: AboutIcon
  title: string
  description: string
  footer: string
}

export type AboutMethodStep = {
  icon: AboutIcon
  title: string
  description: string
  footer: string
}

export type AboutSector = {
  icon: AboutIcon
  title: string
  description: string
}

/** Text-only form state. The hero image is tracked separately in the form. */
export type AboutFormValues = {
  hero: {
    eyebrow: string
    title: string
    intro: string
    alt: string
    approachLabel: string
    snapshotLabel: string
    snapshots: AboutSnapshot[]
    overlay: AboutOverlay
  }
  heritage: {
    eyebrow: string
    title: string
    narrative: string
    approach: string
    basedInLabel: string
    basedInValue: string
    approachLabel: string
    milestones: AboutMilestone[]
  }
  visionMission: {
    vision: AboutVisionCard
    mission: AboutVisionCard
  }
  pillars: {
    eyebrow: string
    title: string
    intro: string
    items: AboutPillar[]
  }
  methodology: {
    eyebrow: string
    title: string
    intro: string
    protocolLabel: string
    stagesLabel: string
    steps: AboutMethodStep[]
  }
  industries: {
    eyebrow: string
    title: string
    intro: string
    sectors: AboutSector[]
  }
  cta: {
    eyebrow: string
    title: string
    body: string
    projectsLabel: string
    phoneLabel: string
    whatsappLabel: string
  }
}

/** A validated file that has not been uploaded yet. */
export type AboutNewImage = {
  kind: 'new'
  file: File
  /** Local object URL used only for the preview; never persisted. */
  previewUrl: string
  width: number
  height: number
  size: number
  contentType: ImageContentType
  /** Original byte size before any optimization. */
  originalSize: number
  /** True when the file was downscaled and re-encoded. */
  optimized: boolean
}

export type AboutStoredImage = {
  kind: 'stored'
  image: AboutImage
}

export type AboutNoImage = {
  kind: 'none'
}

export type AboutImageSelection = AboutNewImage | AboutStoredImage | AboutNoImage

/** Complete save payload: validated text plus the chosen hero image. */
export type AboutDraft = Omit<AboutFormValues, 'hero'> & {
  hero: AboutFormValues['hero'] & { image: AboutImageSelection }
}

export type AboutContent = Omit<AboutFormValues, 'hero'> & {
  hero: Omit<AboutFormValues['hero'], 'alt'> & { image: AboutImage }
  updatedAt: Date | null
  updatedBy: string | null
}

export type AboutStatus = 'loading' | 'ready' | 'saving' | 'error'

export type AboutErrorCode =
  | 'permission-denied'
  | 'not-ready'
  | 'network'
  | 'validation'
  | 'upload'
  | 'invalid-document'
  | 'unknown'

import type { ProjectCategory } from './constants'

export type ImageContentType = 'image/jpeg' | 'image/png' | 'image/webp'

/** One stored raster image plus the metadata the document keeps. */
export type ProjectImage = {
  url: string
  path: string
  alt: string
  width: number
  height: number
  size: number
  contentType: string
}

/** Text-only slot state. The image selection lives outside the form values. */
export type ProjectFormValues = {
  category: ProjectCategory
  subTag: string
  location: string
  year: string
  typePlaceholder: string
  title: string
  summary: string
  ref: string
  specLabel: string
  specValue: string
  specDetail: string
  alt: string
}

export type ProjectContent = ProjectFormValues & { image: ProjectImage }

export type TrackRecordColumn = {
  kicker: string
  value: string
  description: string
}

export type ProjectsFormValues = {
  hero: {
    eyebrow: string
    title: string
    intro: string
  }
  portfolio: {
    projects: ProjectFormValues[]
  }
  trackRecord: {
    columns: TrackRecordColumn[]
  }
  cta: {
    eyebrow: string
    title: string
    body: string
  }
}

/** A validated file that has not been uploaded yet. */
export type ProjectNewImage = {
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

export type ProjectStoredImage = {
  kind: 'stored'
  image: ProjectImage
}

export type ProjectNoImage = {
  kind: 'none'
}

export type ProjectImageSelection =
  | ProjectNewImage
  | ProjectStoredImage
  | ProjectNoImage

/**
 * Complete save payload: validated text (including per-card alt attributes)
 * plus one image selection per fixed project slot.
 */
export type ProjectsDraft = ProjectsFormValues & {
  images: ProjectImageSelection[]
}

export type ProjectsContent = Omit<ProjectsFormValues, 'portfolio'> & {
  portfolio: {
    projects: ProjectContent[]
  }
  updatedAt: Date | null
  updatedBy: string | null
}

export type ProjectsStatus = 'loading' | 'ready' | 'saving' | 'error'

export type ProjectsErrorCode =
  | 'permission-denied'
  | 'not-ready'
  | 'network'
  | 'validation'
  | 'upload'
  | 'invalid-document'
  | 'unknown'

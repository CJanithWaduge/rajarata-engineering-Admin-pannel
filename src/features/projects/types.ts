import type { ProjectCategory } from './constants'

export type ProjectContent = {
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
}

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
    projects: ProjectContent[]
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

export type ProjectsContent = ProjectsFormValues & {
  updatedAt: Date | null
  updatedBy: string | null
}

export type ProjectsStatus = 'loading' | 'ready' | 'saving' | 'error'

export type ProjectsErrorCode =
  | 'permission-denied'
  | 'not-ready'
  | 'network'
  | 'validation'
  | 'invalid-document'
  | 'unknown'

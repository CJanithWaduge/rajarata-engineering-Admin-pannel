import {
  PROJECT_CATEGORIES,
  PROJECT_COUNT,
  TRACK_RECORD_COUNT,
} from './constants'
import type {
  ProjectContent,
  ProjectsContent,
  ProjectsFormValues,
  TrackRecordColumn,
} from './types'

export function createEmptyColumn(): TrackRecordColumn {
  return { kicker: '', value: '', description: '' }
}

export function createEmptyProject(index: number): ProjectContent {
  return {
    category: PROJECT_CATEGORIES[index % PROJECT_CATEGORIES.length] ?? PROJECT_CATEGORIES[0],
    subTag: '',
    location: '',
    year: '',
    typePlaceholder: '',
    title: '',
    summary: '',
    ref: '',
    specLabel: '',
    specValue: '',
    specDetail: '',
  }
}

/** Empty form state only. No site copy or seed values live here. */
export function createEmptyProjectsValues(): ProjectsFormValues {
  return {
    hero: { eyebrow: '', title: '', intro: '' },
    portfolio: {
      projects: Array.from({ length: PROJECT_COUNT }, (_, index) =>
        createEmptyProject(index),
      ),
    },
    trackRecord: {
      columns: Array.from({ length: TRACK_RECORD_COUNT }, createEmptyColumn),
    },
    cta: { eyebrow: '', title: '', body: '' },
  }
}

/**
 * Copies stored content into fresh form state. The document is validated before
 * it reaches this point, so the fixed arrays already carry the right length.
 */
export function valuesFromContent(
  content: ProjectsContent | null,
): ProjectsFormValues {
  if (!content) return createEmptyProjectsValues()

  return {
    hero: {
      eyebrow: content.hero.eyebrow,
      title: content.hero.title,
      intro: content.hero.intro,
    },
    portfolio: {
      projects: content.portfolio.projects.map((project) => ({
        ...project,
      })),
    },
    trackRecord: {
      columns: content.trackRecord.columns.map((column) => ({
        ...column,
      })),
    },
    cta: {
      eyebrow: content.cta.eyebrow,
      title: content.cta.title,
      body: content.cta.body,
    },
  }
}

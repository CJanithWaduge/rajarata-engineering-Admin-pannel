import {
  PROJECT_CATEGORIES,
  PROJECT_COUNT,
  TRACK_RECORD_COUNT,
} from './constants'
import type {
  ProjectFormValues,
  ProjectsContent,
  ProjectsFormValues,
  ProjectImageSelection,
  TrackRecordColumn,
} from './types'

export function createEmptyColumn(): TrackRecordColumn {
  return { kicker: '', value: '', description: '' }
}

export function createEmptyProject(index: number): ProjectFormValues {
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
    alt: '',
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

/** Copies stored content into fresh form state without inventing copy. */
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
        category: project.category,
        subTag: project.subTag,
        location: project.location,
        year: project.year,
        typePlaceholder: project.typePlaceholder,
        title: project.title,
        summary: project.summary,
        ref: project.ref,
        specLabel: project.specLabel,
        specValue: project.specValue,
        specDetail: project.specDetail,
        alt: project.alt,
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

/** Initial per-slot image state for the form. */
export function imageSelectionFromContent(
  content: ProjectsContent | null,
): ProjectImageSelection[] {
  return Array.from({ length: PROJECT_COUNT }, (_, index): ProjectImageSelection => {
    const image = content?.portfolio.projects[index]?.image
    if (!image || !image.url) return { kind: 'none' }
    return { kind: 'stored', image: { ...image } }
  })
}

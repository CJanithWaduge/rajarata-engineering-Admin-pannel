import {
  PROJECT_CATEGORIES,
  PROJECT_COUNT,
  TRACK_RECORD_COUNT,
} from '../constants'
import { createEmptyProjectsValues } from '../defaults'
import type { ProjectsContent, ProjectsFormValues } from '../types'

function category(index: number) {
  return PROJECT_CATEGORIES[index % PROJECT_CATEGORIES.length] ?? PROJECT_CATEGORIES[0]
}

/** Generic test values only; never imported by production code. */
export function validValues(): ProjectsFormValues {
  const values = createEmptyProjectsValues()

  values.hero = {
    eyebrow: 'Engineering projects',
    title: 'Electrical projects we take on',
    intro: 'A portfolio of installed electrical work.',
  }

  values.portfolio = {
    projects: Array.from({ length: PROJECT_COUNT }, (_, index) => ({
      category: category(index),
      subTag: `Sub tag ${index + 1}`,
      location: `Location ${index + 1}`,
      year: `Year ${index + 1}`,
      typePlaceholder: `Type ${index + 1}`,
      title: `Project ${index + 1}`,
      summary: `Project summary ${index + 1}`,
      ref: `Ref ${index + 1}`,
      specLabel: `Spec label ${index + 1}`,
      specValue: `Spec value ${index + 1}`,
      specDetail: `Spec detail ${index + 1}`,
    })),
  }

  values.trackRecord = {
    columns: Array.from({ length: TRACK_RECORD_COUNT }, (_, index) => ({
      kicker: `Track kicker ${index + 1}`,
      value: `Track value ${index + 1}`,
      description: `Track description ${index + 1}`,
    })),
  }

  values.cta = {
    eyebrow: 'Talk to us',
    title: 'Have a project like this?',
    body: 'Tell us about your site.',
  }

  return values
}

export function validContent(): ProjectsContent {
  return {
    ...validValues(),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedBy: 'uid-1',
  }
}

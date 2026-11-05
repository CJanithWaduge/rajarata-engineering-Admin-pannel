import {
  PROJECT_CATEGORIES,
  PROJECT_COUNT,
  TRACK_RECORD_COUNT,
} from '../constants'
import { createEmptyProjectsValues } from '../defaults'
import type {
  ProjectsContent,
  ProjectsDraft,
  ProjectsFormValues,
} from '../types'

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
      alt: `Card image alt ${index + 1}`,
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

/**
 * Raw document as stored in Firestore: per-project text without `alt`, one
 * prefixed image object per slot — matches what the admin client writes and
 * what the emulator reads back.
 */
export function validStoredDocument() {
  const values = validValues()

  return {
    hero: values.hero,
    portfolio: {
      projects: values.portfolio.projects.map((project, index) => {
        const { alt: _alt, ...text } = project

        return {
          ...text,
          image: {
            imageUrl: `https://cdn.example.test/projects/card-${index + 1}.webp`,
            imagePath: `projects/cards/${index + 1}/card.webp`,
            imageAlt: `Card image alt ${index + 1}`,
            imageWidth: 1600,
            imageHeight: 1000,
            imageSize: 120_000,
            imageContentType: 'image/webp',
          },
        }
      }),
    },
    trackRecord: values.trackRecord,
    cta: values.cta,
    updatedBy: 'uid-2',
  }
}

export function validDraft(): ProjectsDraft {
  return {
    ...validValues(),
    images: Array.from({ length: PROJECT_COUNT }, () => ({
      kind: 'none' as const,
    })),
  }
}

export function validContent(): ProjectsContent {
  const values = validValues()

  return {
    ...values,
    portfolio: {
      projects: values.portfolio.projects.map((project, index) => ({
        ...project,
        image: {
          url: `https://cdn.example.test/projects/card-${index + 1}.webp`,
          path: `projects/cards/${index + 1}/card.webp`,
          alt: project.alt,
          width: 1600,
          height: 1000,
          size: 120_000,
          contentType: 'image/webp',
        },
      })),
    },
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedBy: 'uid-1',
  }
}

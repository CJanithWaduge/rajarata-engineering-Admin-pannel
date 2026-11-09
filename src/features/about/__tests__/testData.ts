import {
  ABOUT_ICONS,
  METHOD_STEP_COUNT,
  MILESTONE_COUNT,
  PILLAR_COUNT,
  SECTOR_COUNT,
  SNAPSHOT_COUNT,
} from '../constants'
import { createEmptyAboutValues } from '../defaults'
import type {
  AboutContent,
  AboutDraft,
  AboutFormValues,
  AboutImage,
} from '../types'

function icon(index: number) {
  return ABOUT_ICONS[index % ABOUT_ICONS.length] ?? ABOUT_ICONS[0]
}

/** Generic test values only; never imported by production code. */
export function validValues(): AboutFormValues {
  const values = createEmptyAboutValues()

  values.hero = {
    eyebrow: 'Inside the practice',
    title: 'About the engineering practice',
    intro: 'A complete electrical engineering and contracting scope.',
    alt: 'Technician inspecting a distribution panel',
    approachLabel: 'Our approach and methodology',
    snapshotLabel: 'Scope',
    snapshots: Array.from({ length: SNAPSHOT_COUNT }, (_, index) => ({
      title: `Snapshot ${index + 1}`,
      description: `Snapshot description ${index + 1}`,
    })),
    overlay: {
      title: 'Commissioning checks',
      description: 'Insulation, earthing, and functional testing.',
      stage: 'Test and handover',
      stageLabel: 'Work stage',
    },
  }

  values.heritage = {
    eyebrow: 'How we work',
    title: 'Engineering heritage',
    narrative: 'Every job follows the same route from survey to handover.',
    approach: 'Design, installation, and testing are one continuous job.',
    basedInLabel: 'Based in',
    basedInValue: 'Anuradhapura, Sri Lanka',
    approachLabel: 'Our approach',
    milestones: Array.from({ length: MILESTONE_COUNT }, (_, index) => ({
      kicker: `Milestone kicker ${index + 1}`,
      badge: `Badge ${index + 1}`,
      title: `Milestone title ${index + 1}`,
      description: `Milestone description ${index + 1}`,
    })),
  }

  values.visionMission = {
    vision: {
      eyebrow: 'Strategic horizon',
      title: 'Our vision',
      body: 'To be known for careful electrical work.',
      footer: 'Engineering future-ready infrastructure',
    },
    mission: {
      eyebrow: 'Tactical purpose',
      title: 'Our mission',
      body: 'To deliver every installation with clean workmanship.',
      footer: 'Uncompromising safety and quality governance',
    },
  }

  values.pillars = {
    eyebrow: 'Guiding code',
    title: 'Core pillars',
    intro: 'The standards committed to on every job.',
    items: Array.from({ length: PILLAR_COUNT }, (_, index) => ({
      icon: icon(index),
      title: `Pillar ${index + 1}`,
      description: `Pillar description ${index + 1}`,
      footer: `Pillar footer ${index + 1}`,
    })),
  }

  values.methodology = {
    eyebrow: 'Execution architecture',
    title: 'Project methodology',
    intro: 'Every project moves through the same stages.',
    protocolLabel: 'Lifecycle protocol',
    stagesLabel: 'Project stages',
    steps: Array.from({ length: METHOD_STEP_COUNT }, (_, index) => ({
      icon: icon(index),
      title: `Stage ${index + 1}`,
      description: `Stage description ${index + 1}`,
      footer: `Stage footer ${index + 1}`,
    })),
  }

  values.industries = {
    eyebrow: 'Where we work',
    title: 'Sectors we serve',
    intro: 'Distribution and ELV systems across these settings.',
    sectors: Array.from({ length: SECTOR_COUNT }, (_, index) => ({
      icon: icon(index),
      title: `Sector ${index + 1}`,
      description: `Sector description ${index + 1}`,
    })),
  }

  values.cta = {
    eyebrow: 'Engineering consultation',
    title: 'Plan the next installation',
    body: 'Reach the team to discuss the electrical scope.',
    projectsLabel: 'View past projects',
    phoneLabel: 'Phone',
    whatsappLabel: 'WhatsApp',
  }

  return values
}

export function validImage(): AboutImage {
  return {
    url: 'https://firebasestorage.googleapis.com/v0/b/test/o/about%2Fhero%2Fstored.webp',
    path: 'about/hero/stored.webp',
    alt: 'Technician inspecting a distribution panel',
    width: 1600,
    height: 1000,
    size: 120_000,
    contentType: 'image/webp',
  }
}

export function validContent(): AboutContent {
  const values = validValues()

  return {
    ...values,
    hero: {
      eyebrow: values.hero.eyebrow,
      title: values.hero.title,
      intro: values.hero.intro,
      approachLabel: values.hero.approachLabel,
      snapshotLabel: values.hero.snapshotLabel,
      snapshots: values.hero.snapshots,
      overlay: values.hero.overlay,
      image: validImage(),
    },
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedBy: 'uid-1',
  }
}

/** Text values plus an already-stored hero image, ready for a save. */
export function validDraft(): AboutDraft {
  const values = validValues()
  return {
    ...values,
    hero: { ...values.hero, image: { kind: 'stored', image: validImage() } },
  }
}

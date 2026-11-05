import {
  METHOD_STEP_COUNT,
  MILESTONE_COUNT,
  PILLAR_COUNT,
  SECTOR_COUNT,
  SNAPSHOT_COUNT,
} from './constants'
import type {
  AboutContent,
  AboutFormValues,
  AboutImageSelection,
  AboutMethodStep,
  AboutMilestone,
  AboutPillar,
  AboutSector,
  AboutSnapshot,
  AboutVisionCard,
} from './types'

export function createEmptySnapshot(): AboutSnapshot {
  return { title: '', description: '' }
}

export function createEmptyMilestone(): AboutMilestone {
  return { kicker: '', badge: '', title: '', description: '' }
}

export function createEmptyVisionCard(): AboutVisionCard {
  return { eyebrow: '', title: '', body: '', footer: '' }
}

export function createEmptyPillar(): AboutPillar {
  return {
    icon: '',
    title: '',
    description: '',
    footer: '',
  }
}

export function createEmptyMethodStep(): AboutMethodStep {
  return {
    icon: '',
    title: '',
    description: '',
    footer: '',
  }
}

export function createEmptySector(): AboutSector {
  return {
    icon: '',
    title: '',
    description: '',
  }
}

/** Empty form state only. No site copy or seed values live here. */
export function createEmptyAboutValues(): AboutFormValues {
  return {
    hero: {
      eyebrow: '',
      title: '',
      intro: '',
      alt: '',
      snapshots: Array.from({ length: SNAPSHOT_COUNT }, createEmptySnapshot),
      overlay: { title: '', description: '', stage: '' },
    },
    heritage: {
      eyebrow: '',
      title: '',
      narrative: '',
      approach: '',
      milestones: Array.from({ length: MILESTONE_COUNT }, createEmptyMilestone),
    },
    visionMission: {
      vision: createEmptyVisionCard(),
      mission: createEmptyVisionCard(),
    },
    pillars: {
      eyebrow: '',
      title: '',
      intro: '',
      items: Array.from({ length: PILLAR_COUNT }, createEmptyPillar),
    },
    methodology: {
      eyebrow: '',
      title: '',
      intro: '',
      steps: Array.from({ length: METHOD_STEP_COUNT }, createEmptyMethodStep),
    },
    industries: {
      eyebrow: '',
      title: '',
      intro: '',
      sectors: Array.from({ length: SECTOR_COUNT }, createEmptySector),
    },
    cta: { eyebrow: '', title: '', body: '' },
  }
}

function pad<T>(items: T[] | undefined, length: number, create: () => T): T[] {
  return Array.from({ length }, (_, index) => items?.[index] ?? create())
}

/** Copies stored content into fresh form state without inventing copy. */
export function valuesFromContent(
  content: AboutContent | null,
): AboutFormValues {
  if (!content) return createEmptyAboutValues()

  return {
    hero: {
      eyebrow: content.hero.eyebrow,
      title: content.hero.title,
      intro: content.hero.intro,
      alt: content.hero.image.alt,
      snapshots: pad(content.hero.snapshots, SNAPSHOT_COUNT, createEmptySnapshot).map(
        (snapshot) => ({ ...snapshot }),
      ),
      overlay: { ...content.hero.overlay },
    },
    heritage: {
      eyebrow: content.heritage.eyebrow,
      title: content.heritage.title,
      narrative: content.heritage.narrative,
      approach: content.heritage.approach,
      milestones: pad(
        content.heritage.milestones,
        MILESTONE_COUNT,
        createEmptyMilestone,
      ).map((milestone) => ({ ...milestone })),
    },
    visionMission: {
      vision: { ...content.visionMission.vision },
      mission: { ...content.visionMission.mission },
    },
    pillars: {
      eyebrow: content.pillars.eyebrow,
      title: content.pillars.title,
      intro: content.pillars.intro,
      items: pad(content.pillars.items, PILLAR_COUNT, createEmptyPillar).map(
        (pillar) => ({ ...pillar }),
      ),
    },
    methodology: {
      eyebrow: content.methodology.eyebrow,
      title: content.methodology.title,
      intro: content.methodology.intro,
      steps: pad(
        content.methodology.steps,
        METHOD_STEP_COUNT,
        createEmptyMethodStep,
      ).map((step) => ({ ...step })),
    },
    industries: {
      eyebrow: content.industries.eyebrow,
      title: content.industries.title,
      intro: content.industries.intro,
      sectors: pad(content.industries.sectors, SECTOR_COUNT, createEmptySector).map(
        (sector) => ({ ...sector }),
      ),
    },
    cta: { ...content.cta },
  }
}

/** Initial hero-image state for the form. */
export function imageSelectionFromContent(
  content: AboutContent | null,
): AboutImageSelection {
  if (!content || !content.hero.image.url) return { kind: 'none' }
  return { kind: 'stored', image: content.hero.image }
}

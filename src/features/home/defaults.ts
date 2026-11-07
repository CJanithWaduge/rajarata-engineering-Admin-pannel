import { CARD_COUNT, HOME_SERVICE_COUNT } from './constants'
import type {
  CardDraft,
  FeaturedProject,
  HomeContent,
  HomeDraft,
  HomeImage,
  HomeService,
  ImageSelection,
} from './types'

export const EMPTY_IMAGE: HomeImage = {
  url: '',
  path: '',
  alt: '',
  width: 0,
  height: 0,
  size: 0,
  contentType: '',
}

export function emptyProject(): FeaturedProject {
  return {
    image: { ...EMPTY_IMAGE },
    category: '',
    venue: '',
    topic: '',
    tag: '',
  }
}

export function createEmptyCard(): CardDraft {
  return {
    image: { kind: 'none' },
    alt: '',
    category: '',
    venue: '',
    topic: '',
    tag: '',
  }
}

export function createEmptyService(): HomeService {
  return { icon: '', title: '', description: '', href: '' }
}

export function createEmptyDraft(): HomeDraft {
  return {
    hero: { image: { kind: 'none' }, alt: '' },
    cards: Array.from({ length: CARD_COUNT }, createEmptyCard),
    services: Array.from({ length: HOME_SERVICE_COUNT }, createEmptyService),
  }
}

function toSelection(image: HomeImage | undefined): ImageSelection {
  if (!image || !image.url) return { kind: 'none' }
  return { kind: 'stored', image }
}

/** Builds editable state from the stored document without inventing content. */
export function draftFromContent(content: HomeContent | null): HomeDraft {
  if (!content) return createEmptyDraft()

  return {
    hero: {
      image: toSelection(content.hero),
      alt: content.hero.alt,
    },
    cards: Array.from({ length: CARD_COUNT }, (_, index) => {
      const project = content.featuredProjects[index]
      if (!project) return createEmptyCard()

      return {
        image: toSelection(project.image),
        alt: project.image.alt,
        category: project.category,
        venue: project.venue,
        topic: project.topic,
        tag: project.tag,
      }
    }),
    services: Array.from({ length: HOME_SERVICE_COUNT }, (_, index) => {
      const service = content.featuredServices?.[index]
      if (!service) return createEmptyService()

      return {
        icon: service.icon,
        title: service.title,
        description: service.description,
        href: service.href,
      }
    }),
  }
}

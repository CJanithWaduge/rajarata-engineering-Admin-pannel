import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { CARD_COUNT } from './constants'
import { emptyProject } from './defaults'
import { HomeError, logHomeError, toHomeError } from './errors'
import { homeTextSchema } from './schema'
import { deleteHomeObject, uploadHomeImage } from './storageService'
import type {
  FeaturedProject,
  HomeContent,
  HomeDraft,
  HomeImage,
  ImageSelection,
} from './types'

const HOME_REF = doc(db, 'site', 'home')

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function readNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function readImage(value: unknown): HomeImage {
  const record = isRecord(value) ? value : {}
  return {
    url: readString(record.imageUrl),
    path: readString(record.imagePath),
    alt: readString(record.imageAlt),
    width: readNumber(record.imageWidth),
    height: readNumber(record.imageHeight),
    size: readNumber(record.imageSize),
    contentType: readString(record.imageContentType),
  }
}

function readProject(value: unknown): FeaturedProject {
  const record = isRecord(value) ? value : {}
  return {
    image: readImage(record),
    category: readString(record.category),
    venue: readString(record.venue),
    topic: readString(record.topic),
    tag: readString(record.tag),
  }
}

/**
 * The document deliberately stores image metadata flat on the card and with an
 * `image*` prefix. Both this panel and the public site read that shape, and
 * flattening keeps the rules readable. Never write the in-memory `HomeImage`
 * object directly.
 */
function toDocImage(image: HomeImage) {
  return {
    imageUrl: image.url,
    imagePath: image.path,
    imageAlt: image.alt,
    imageWidth: image.width,
    imageHeight: image.height,
    imageSize: image.size,
    imageContentType: image.contentType,
  }
}

function toDocProject(project: FeaturedProject) {
  return {
    ...toDocImage(project.image),
    category: project.category,
    venue: project.venue,
    topic: project.topic,
    tag: project.tag,
  }
}

function toHomeContent(data: Record<string, unknown>): HomeContent {
  const rawProjects = Array.isArray(data.featuredProjects)
    ? data.featuredProjects.slice(0, CARD_COUNT).map(readProject)
    : []

  while (rawProjects.length < CARD_COUNT) {
    rawProjects.push(emptyProject())
  }

  const updatedAtValue = data.updatedAt
  const updatedByValue = data.updatedBy

  return {
    hero: readImage(data.hero),
    featuredProjects: rawProjects,
    updatedAt: updatedAtValue instanceof Timestamp ? updatedAtValue.toDate() : null,
    updatedBy: typeof updatedByValue === 'string' ? updatedByValue : null,
  }
}

export async function getHomeContent(): Promise<{
  content: HomeContent | null
  exists: boolean
}> {
  try {
    const snapshot = await getDoc(HOME_REF)
    if (!snapshot.exists()) {
      return { content: null, exists: false }
    }
    return {
      content: toHomeContent(snapshot.data() as Record<string, unknown>),
      exists: true,
    }
  } catch (error) {
    const mapped = toHomeError(error)
    logHomeError(mapped.code, (error as { code?: string } | null)?.code)
    throw mapped
  }
}

type ResolvedImage = {
  image: HomeImage
  uploaded: boolean
}

async function resolveImage(
  selection: ImageSelection,
  kind: 'hero' | 'card',
  slot: number | undefined,
  alt: string,
): Promise<ResolvedImage> {
  if (selection.kind === 'stored') {
    return { image: { ...selection.image, alt }, uploaded: false }
  }

  if (selection.kind === 'none') {
    throw new HomeError(
      'validation',
      kind === 'hero' ? 'Choose a hero image before saving.' : 'Choose an image for every card.',
    )
  }

  const image = await uploadHomeImage({
    file: selection.file,
    kind,
    ...(slot === undefined ? {} : { slot }),
    width: selection.width,
    height: selection.height,
    contentType: selection.contentType,
    alt,
  })

  return { image, uploaded: true }
}

/**
 * Validates text, uploads only the changed images, writes the singleton, then
 * deletes the objects the document no longer references. A failed write rolls
 * back every object uploaded by this attempt.
 */
export async function saveHomeContent(
  draft: HomeDraft,
  uid: string,
  previous: HomeContent | null,
): Promise<HomeContent> {
  const parsed = homeTextSchema.safeParse({
    heroAlt: draft.hero.alt,
    cards: draft.cards.map((card) => ({
      alt: card.alt,
      category: card.category,
      venue: card.venue,
      topic: card.topic,
      tag: card.tag,
    })),
  })

  if (!parsed.success) {
    throw new HomeError('validation')
  }

  if (draft.hero.image.kind === 'none') {
    throw new HomeError('validation', 'Choose a hero image before saving.')
  }

  const uploaded: HomeImage[] = []

  try {
    const hero = await resolveImage(draft.hero.image, 'hero', undefined, parsed.data.heroAlt)
    if (hero.uploaded) uploaded.push(hero.image)

    const projects: FeaturedProject[] = []

    for (let index = 0; index < CARD_COUNT; index += 1) {
      const card = draft.cards[index]
      const text = parsed.data.cards[index]

      if (!card || !text) {
        throw new HomeError('validation', `Card ${index + 1} is incomplete.`)
      }

      if (card.image.kind === 'none') {
        throw new HomeError('validation', `Choose an image for card ${index + 1}.`)
      }

      const resolved = await resolveImage(card.image, 'card', index + 1, text.alt)
      if (resolved.uploaded) uploaded.push(resolved.image)

      projects.push({
        image: resolved.image,
        category: text.category,
        venue: text.venue,
        topic: text.topic,
        tag: text.tag,
      })
    }

    await setDoc(HOME_REF, {
      hero: toDocImage(hero.image),
      featuredProjects: projects.map(toDocProject),
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    })

    const oldPaths = previous
      ? [
          previous.hero.path,
          ...previous.featuredProjects.map((project) => project.image.path),
        ]
      : []
    const newPaths = new Set([
      hero.image.path,
      ...projects.map((project) => project.image.path),
    ])

    await Promise.allSettled(
      oldPaths
        .filter((path) => path !== '' && !newPaths.has(path))
        .map((path) => deleteHomeObject(path)),
    )

    return {
      hero: hero.image,
      featuredProjects: projects,
      updatedAt: new Date(),
      updatedBy: uid,
    }
  } catch (error) {
    await Promise.allSettled(uploaded.map((image) => deleteHomeObject(image.path)))
    throw toHomeError(error)
  }
}

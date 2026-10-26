import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { CARD_COUNT, INLINE_MEDIA_DOC_BUDGET } from './constants'
import { EMPTY_IMAGE, emptyProject } from './defaults'
import { HomeError, logHomeError, toHomeError } from './errors'
import { toInlineImage } from './inlineMedia'
import { INLINE_MEDIA_ENABLED } from './mediaMode'
import { deleteHomeObject, uploadHomeImage } from './storageService'
import { validateHomeDraft } from './validation'
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

  if (INLINE_MEDIA_ENABLED) {
    return { image: await toInlineImage(selection, alt), uploaded: false }
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
  const validation = validateHomeDraft(draft)
  const firstError =
    Object.values(validation.textErrors)[0] ?? Object.values(validation.imageErrors)[0]

  if (firstError) {
    throw new HomeError('validation', firstError)
  }

  const normalized = validation.normalized
  const uploaded: HomeImage[] = []
  const projects: FeaturedProject[] = Array.from(
    { length: CARD_COUNT },
    () => emptyProject(),
  )

  try {
    // Start every upload in the same tick. Awaiting hero -> card 1 -> card 2 ->
    // card 3 made a four-image save take the sum of four round trips (and the
    // resumable upload protocol uses several requests per file), which is what
    // made saving feel stalled on a normal connection.
    const jobs: Array<Promise<void>> = []

    let heroImage: HomeImage = { ...EMPTY_IMAGE, alt: '' }
    if (normalized.hero.image.kind !== 'none') {
      jobs.push(
        resolveImage(
          normalized.hero.image,
          'hero',
          undefined,
          normalized.hero.alt,
        ).then((hero) => {
          heroImage = hero.image
          if (hero.uploaded) uploaded.push(hero.image)
        }),
      )
    }

    for (let index = 0; index < CARD_COUNT; index += 1) {
      const card = normalized.cards[index]

      if (!card) {
        throw new HomeError('validation', `Card ${index + 1} is incomplete.`)
      }

      if (validation.blankCards[index] === true) {
        continue
      }

      if (card.image.kind === 'none') {
        throw new HomeError('validation', `Choose an image for card ${index + 1}.`)
      }

      jobs.push(
        resolveImage(card.image, 'card', index + 1, card.alt).then((resolved) => {
          if (resolved.uploaded) uploaded.push(resolved.image)

          projects[index] = {
            image: resolved.image,
            category: card.category,
            venue: card.venue,
            topic: card.topic,
            tag: card.tag,
          }
        }),
      )
    }

    // allSettled (not all) so a failure still waits for the other uploads and
    // every object created by this attempt is known and can be rolled back.
    const settled = await Promise.allSettled(jobs)
    const failed = settled.find(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    )
    if (failed) throw failed.reason

    if (INLINE_MEDIA_ENABLED) {
      const encodedBytes = [heroImage, ...projects.map((project) => project.image)].reduce(
        (total, image) => total + image.url.length,
        0,
      )
      if (encodedBytes > INLINE_MEDIA_DOC_BUDGET) {
        throw new HomeError(
          'validation',
          'These images are too large to store without Firebase Storage. Choose smaller or simpler images.',
        )
      }
    }

    await setDoc(HOME_REF, {
      hero: toDocImage(heroImage),
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
      heroImage.path,
      ...projects.map((project) => project.image.path),
    ])

    await Promise.allSettled(
      oldPaths
        .filter((path) => path !== '' && !newPaths.has(path))
        .map((path) => deleteHomeObject(path)),
    )

    return {
      hero: heroImage,
      featuredProjects: projects,
      updatedAt: new Date(),
      updatedBy: uid,
    }
  } catch (error) {
    await Promise.allSettled(uploaded.map((image) => deleteHomeObject(image.path)))
    throw toHomeError(error)
  }
}

import {
  doc,
  getDocFromServer,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { INLINE_MEDIA_ENABLED } from '../home/mediaMode'
import { ABOUT_INLINE_MEDIA_DOC_BUDGET } from './constants'
import { AboutError, logAboutError, toAboutError } from './errors'
import { deleteAboutObject, toInlineAboutImage, uploadAboutImage } from './media'
import { aboutContentSchema, aboutFormSchema } from './schema'
import type {
  AboutContent,
  AboutDraft,
  AboutFormValues,
  AboutImage,
  AboutImageSelection,
} from './types'

const ABOUT_REF = doc(db, 'site', 'about')

function readTimestamp(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null
}

/** Flattens the in-memory image into the prefixed shape the document stores. */
function toDocImage(image: AboutImage) {
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

/**
 * The form writes the whole document, so a stored document that fails the
 * strict schema means it was hand-edited or predates the current shape. Refuse
 * it instead of filling gaps with invented copy.
 */
function toAboutContent(data: Record<string, unknown>): AboutContent {
  const parsed = aboutContentSchema.safeParse(data)

  if (!parsed.success) {
    throw new AboutError('invalid-document')
  }

  const hero = parsed.data.hero

  return {
    hero: {
      eyebrow: hero.eyebrow,
      title: hero.title,
      intro: hero.intro,
      snapshots: hero.snapshots,
      overlay: hero.overlay,
      image: {
        url: hero.image.imageUrl,
        path: hero.image.imagePath,
        alt: hero.image.imageAlt,
        width: hero.image.imageWidth,
        height: hero.image.imageHeight,
        size: hero.image.imageSize,
        contentType: hero.image.imageContentType,
      },
    },
    heritage: parsed.data.heritage,
    visionMission: parsed.data.visionMission,
    pillars: parsed.data.pillars,
    methodology: parsed.data.methodology,
    industries: parsed.data.industries,
    cta: parsed.data.cta,
    updatedAt: readTimestamp(data.updatedAt),
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : null,
  }
}

export async function getAboutContent(): Promise<{
  content: AboutContent | null
  exists: boolean
}> {
  try {
    const snapshot = await getDocFromServer(ABOUT_REF)
    if (!snapshot.exists()) {
      return { content: null, exists: false }
    }

    return {
      content: toAboutContent(snapshot.data() as Record<string, unknown>),
      exists: true,
    }
  } catch (error) {
    const mapped = toAboutError(error)
    logAboutError(mapped.code, (error as { code?: string } | null)?.code)
    throw mapped
  }
}

type ResolvedImage = {
  image: AboutImage
  uploaded: boolean
}

/** Empty image means "keep the public page hero". */
function emptyHeroImage(): AboutImage {
  return {
    url: '',
    path: '',
    alt: '',
    width: 0,
    height: 0,
    size: 0,
    contentType: '',
  }
}

function hasImage(selection: AboutImageSelection): boolean {
  if (selection.kind === 'new') return true
  if (selection.kind === 'stored') return selection.image.url.trim() !== ''
  return false
}

async function resolveHeroImage(
  selection: AboutImageSelection,
  alt: string,
): Promise<ResolvedImage> {
  if (!hasImage(selection)) {
    return { image: emptyHeroImage(), uploaded: false }
  }

  // An admin-supplied image has no public fallback, so its alt text is
  // mandatory even though every other About field is optional.
  if (alt.trim() === '') {
    throw new AboutError(
      'validation',
      'Hero image alt text is required when a hero image is set.',
    )
  }

  if (selection.kind === 'stored') {
    return { image: { ...selection.image, alt }, uploaded: false }
  }

  if (selection.kind === 'none') {
    return { image: emptyHeroImage(), uploaded: false }
  }

  if (INLINE_MEDIA_ENABLED) {
    return { image: await toInlineAboutImage(selection, alt), uploaded: false }
  }

  const image = await uploadAboutImage(selection, alt)
  return { image, uploaded: true }
}

/**
 * Validates the text, resolves the single hero image (inline data URL or a
 * Storage upload), writes the singleton, then removes the Storage object the
 * document no longer references. A failed write rolls back a new upload.
 */
export async function saveAboutContent(
  draft: AboutDraft,
  uid: string,
  previous: AboutContent | null,
): Promise<AboutContent> {
  const parsed = aboutFormSchema.safeParse(draft)

  if (!parsed.success) {
    throw new AboutError(
      'validation',
      parsed.error.issues[0]?.message ?? undefined,
    )
  }

  const values: AboutFormValues = parsed.data
  let uploaded: AboutImage | null = null

  try {
    const resolved = await resolveHeroImage(draft.hero.image, values.hero.alt)
    if (resolved.uploaded) uploaded = resolved.image

    if (
      INLINE_MEDIA_ENABLED &&
      resolved.image.url.length > ABOUT_INLINE_MEDIA_DOC_BUDGET
    ) {
      throw new AboutError(
        'validation',
        'This image is too large to store without Firebase Storage. Choose a smaller or simpler image.',
      )
    }

    await setDoc(ABOUT_REF, {
      hero: {
        eyebrow: values.hero.eyebrow,
        title: values.hero.title,
        intro: values.hero.intro,
        image: toDocImage(resolved.image),
        snapshots: values.hero.snapshots,
        overlay: values.hero.overlay,
      },
      heritage: values.heritage,
      visionMission: values.visionMission,
      pillars: values.pillars,
      methodology: values.methodology,
      industries: values.industries,
      cta: values.cta,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    })

    const oldPath = previous?.hero.image.path ?? ''
    if (oldPath !== '' && oldPath !== resolved.image.path) {
      await Promise.allSettled([deleteAboutObject(oldPath)])
    }

    return {
      hero: {
        eyebrow: values.hero.eyebrow,
        title: values.hero.title,
        intro: values.hero.intro,
        snapshots: values.hero.snapshots,
        overlay: values.hero.overlay,
        image: resolved.image,
      },
      heritage: values.heritage,
      visionMission: values.visionMission,
      pillars: values.pillars,
      methodology: values.methodology,
      industries: values.industries,
      cta: values.cta,
      updatedAt: new Date(),
      updatedBy: uid,
    }
  } catch (error) {
    if (uploaded) {
      await Promise.allSettled([deleteAboutObject(uploaded.path)])
    }
    throw toAboutError(error)
  }
}

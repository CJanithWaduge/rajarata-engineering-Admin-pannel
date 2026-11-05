import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { INLINE_MEDIA_ENABLED } from '../home/mediaMode'
import {
  PROJECT_COUNT,
  PROJECT_INLINE_MEDIA_DOC_BUDGET,
} from './constants'
import { ProjectsError, logProjectsError, toProjectsError } from './errors'
import {
  deleteProjectObject,
  toInlineProjectImage,
  uploadProjectImage,
} from './media'
import { projectsContentSchema, projectsFormSchema } from './schema'
import type {
  ProjectImage,
  ProjectImageSelection,
  ProjectsContent,
  ProjectsDraft,
} from './types'

const PROJECTS_REF = doc(db, 'site', 'projects')

function readTimestamp(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null
}

function emptyCardImage(): ProjectImage {
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

/** Flattens the in-memory image into the prefixed shape the document stores. */
function toDocImage(image: ProjectImage) {
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
 * The admin form writes the whole document, so a stored document that fails the
 * strict schema means someone edited it by hand. Refuse it instead of filling
 * the gaps with invented copy; the page can then show a repair message. A
 * missing image object (older documents) is accepted as "keep the public
 * image".
 */
function toProjectsContent(data: Record<string, unknown>): ProjectsContent {
  const parsed = projectsContentSchema.safeParse(data)

  if (!parsed.success) {
    throw new ProjectsError('invalid-document')
  }

  return {
    hero: parsed.data.hero,
    portfolio: {
      projects: parsed.data.portfolio.projects.map((project) => {
        const { image, ...text } = project

        return {
          ...text,
          alt: image.imageAlt,
          image: {
            url: image.imageUrl,
            path: image.imagePath,
            alt: image.imageAlt,
            width: image.imageWidth,
            height: image.imageHeight,
            size: image.imageSize,
            contentType: image.imageContentType,
          },
        }
      }),
    },
    trackRecord: parsed.data.trackRecord,
    cta: parsed.data.cta,
    updatedAt: readTimestamp(data.updatedAt),
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : null,
  }
}

export async function getProjectsContent(): Promise<{
  content: ProjectsContent | null
  exists: boolean
}> {
  try {
    const snapshot = await getDoc(PROJECTS_REF)
    if (!snapshot.exists()) {
      return { content: null, exists: false }
    }

    return {
      content: toProjectsContent(snapshot.data() as Record<string, unknown>),
      exists: true,
    }
  } catch (error) {
    const mapped = toProjectsError(error)
    logProjectsError(mapped.code, (error as { code?: string } | null)?.code)
    throw mapped
  }
}

type Resolution = {
  resolved: ProjectImage[]
  uploaded: ProjectImage[]
}

/**
 * Each card slot either keeps its stored/admin image or clears back to the
 * public page's own artwork. An admin-supplied image always needs alt text:
 * the public card has no fallback for it.
 */
async function resolveProjectImages(
  selections: ProjectImageSelection[],
  alts: string[],
): Promise<Resolution> {
  const resolved: ProjectImage[] = []
  const uploaded: ProjectImage[] = []

  for (let index = 0; index < PROJECT_COUNT; index += 1) {
    const selection = selections[index]
    const alt = (alts[index] ?? '').trim()

    if (!selection || selection.kind === 'none') {
      resolved.push(emptyCardImage())
      continue
    }

    if (
      selection.kind === 'stored' &&
      selection.image.url.trim() === ''
    ) {
      resolved.push(emptyCardImage())
      continue
    }

    if (alt === '') {
      throw new ProjectsError(
        'validation',
        `Add alt text for project image ${index + 1}.`,
      )
    }

    if (selection.kind === 'stored') {
      resolved.push({ ...selection.image, alt })
      continue
    }

    if (INLINE_MEDIA_ENABLED) {
      resolved.push(await toInlineProjectImage(selection, alt))
      continue
    }

    const image = await uploadProjectImage(selection, alt, index)
    uploaded.push(image)
    resolved.push(image)
  }

  return { resolved, uploaded }
}

/**
 * Full replace: a removed key cannot linger in the document. After the write
 * settles, the Storage objects the document no longer references are deleted;
 * a failed write rolls back any new uploads.
 */
export async function saveProjectsContent(
  draft: ProjectsDraft,
  uid: string,
  previous: ProjectsContent | null,
): Promise<ProjectsContent> {
  const parsed = projectsFormSchema.safeParse(draft)

  if (!parsed.success) {
    throw new ProjectsError(
      'validation',
      parsed.error.issues[0]?.message ?? undefined,
    )
  }

  const values = parsed.data
  const alts = values.portfolio.projects.map((project) => project.alt)
  let uploaded: ProjectImage[] = []

  try {
    const resolution = await resolveProjectImages(draft.images, alts)
    uploaded = resolution.uploaded
    const { resolved } = resolution

    // Six images may be stored inline in one document; keep the total under
    // the 1 MiB ceiling or the write would be rejected by Firestore.
    if (INLINE_MEDIA_ENABLED) {
      const inlineBytes = resolved.reduce(
        (sum, image) => sum + (image.url.startsWith('data:') ? image.url.length : 0),
        0,
      )
      if (inlineBytes > PROJECT_INLINE_MEDIA_DOC_BUDGET) {
        throw new ProjectsError(
          'validation',
          'The project images are too large to store without Firebase Storage. Choose smaller or simpler images.',
        )
      }
    }

    await setDoc(PROJECTS_REF, {
      hero: values.hero,
      portfolio: {
        projects: values.portfolio.projects.map((project, index) => {
          const { alt: _alt, ...text } = project

          return { ...text, image: toDocImage(resolved[index]!) }
        }),
      },
      trackRecord: values.trackRecord,
      cta: values.cta,
      updatedAt: serverTimestamp(),
      updatedBy: uid,
    })

    const newPaths = new Set(resolved.map((image) => image.path))
    const previousPaths =
      previous?.portfolio.projects.map((project) => project.image.path) ?? []
    for (const oldPath of previousPaths) {
      if (oldPath !== '' && !newPaths.has(oldPath)) {
        await Promise.allSettled([deleteProjectObject(oldPath)])
      }
    }

    return {
      hero: values.hero,
      portfolio: {
        projects: values.portfolio.projects.map((project, index) => ({
          ...project,
          image: resolved[index]!,
        })),
      },
      trackRecord: values.trackRecord,
      cta: values.cta,
      updatedAt: new Date(),
      updatedBy: uid,
    }
  } catch (error) {
    if (uploaded.length > 0) {
      await Promise.allSettled(
        uploaded.map((image) => deleteProjectObject(image.path)),
      )
    }
    throw toProjectsError(error)
  }
}

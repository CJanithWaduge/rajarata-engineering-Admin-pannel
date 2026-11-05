import { deleteImageObject, uploadImageObject } from '../../lib/media/storage'
import { readFileAsDataUrl } from '../home/inlineMedia'
import { formatBytes, readImageFile } from '../home/imageValidation'
import { PROJECT_STORAGE_ROOT } from './constants'
import { ProjectsError } from './errors'
import type { ProjectImage, ProjectNewImage } from './types'

/**
 * The Projects page reuses the Home image gate (extension, MIME, file
 * signature, decode, dimensions, aspect, and in-browser optimization) with the
 * `card` limits and owns its Storage folder. Components never import
 * `firebase/storage`.
 */
export type ProjectImageFileResult =
  | { ok: true; image: ProjectNewImage }
  | { ok: false; message: string }

export async function readProjectImageFile(
  file: File,
): Promise<ProjectImageFileResult> {
  const result = await readImageFile(file, 'card')
  if (!result.ok) return result

  return {
    ok: true,
    image: { kind: 'new', ...result.image },
  }
}

export function formatProjectBytes(bytes: number): string {
  return formatBytes(bytes)
}

export async function uploadProjectImage(
  selection: ProjectNewImage,
  alt: string,
  slot: number,
): Promise<ProjectImage> {
  return uploadImageObject({
    folder: `${PROJECT_STORAGE_ROOT}/${slot + 1}`,
    file: selection.file,
    width: selection.width,
    height: selection.height,
    contentType: selection.contentType,
    alt,
  })
}

export async function toInlineProjectImage(
  selection: ProjectNewImage,
  alt: string,
): Promise<ProjectImage> {
  let url: string
  try {
    url = await readFileAsDataUrl(selection.file)
  } catch {
    throw new ProjectsError(
      'upload',
      'The image could not be prepared for saving.',
    )
  }

  // Only raster data URLs are allowed; never store an SVG or a script-bearing
  // data URL that the public site would put into an <img src>.
  if (!/^data:image\/(?:jpeg|png|webp);base64,/i.test(url)) {
    throw new ProjectsError(
      'upload',
      'The image could not be prepared for saving.',
    )
  }

  return {
    url,
    path: '',
    alt,
    width: selection.width,
    height: selection.height,
    size: selection.size,
    contentType: selection.contentType,
  }
}

export async function deleteProjectObject(path: string): Promise<void> {
  return deleteImageObject(path)
}

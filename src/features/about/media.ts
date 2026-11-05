import { deleteImageObject, uploadImageObject } from '../../lib/media/storage'
import { readFileAsDataUrl } from '../home/inlineMedia'
import { formatBytes, readImageFile } from '../home/imageValidation'
import { ABOUT_STORAGE_ROOT } from './constants'
import { AboutError } from './errors'
import type { AboutImage, AboutNewImage } from './types'

/**
 * The About page reuses the Home image gate (extension, MIME, file signature,
 * decode, dimensions, aspect, and in-browser optimization) but owns its Storage
 * folder and document writes. Components never import `firebase/storage`.
 */
export type AboutImageFileResult =
  | { ok: true; image: AboutNewImage }
  | { ok: false; message: string }

export async function readAboutImageFile(
  file: File,
): Promise<AboutImageFileResult> {
  const result = await readImageFile(file, 'hero')
  if (!result.ok) return result

  return {
    ok: true,
    image: { kind: 'new', ...result.image },
  }
}

export function formatAboutBytes(bytes: number): string {
  return formatBytes(bytes)
}

export async function uploadAboutImage(
  selection: AboutNewImage,
  alt: string,
): Promise<AboutImage> {
  return uploadImageObject({
    folder: ABOUT_STORAGE_ROOT,
    file: selection.file,
    width: selection.width,
    height: selection.height,
    contentType: selection.contentType,
    alt,
  })
}

export async function toInlineAboutImage(
  selection: AboutNewImage,
  alt: string,
): Promise<AboutImage> {
  let url: string
  try {
    url = await readFileAsDataUrl(selection.file)
  } catch {
    throw new AboutError('upload', 'The image could not be prepared for saving.')
  }

  // Only raster data URLs are allowed; never store an SVG or a script-bearing
  // data URL that the public site would put into an <img src>.
  if (!/^data:image\/(?:jpeg|png|webp);base64,/i.test(url)) {
    throw new AboutError('upload', 'The image could not be prepared for saving.')
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

export async function deleteAboutObject(path: string): Promise<void> {
  return deleteImageObject(path)
}

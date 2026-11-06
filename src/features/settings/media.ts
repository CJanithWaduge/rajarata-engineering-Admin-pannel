import { deleteImageObject, uploadImageObject } from '../../lib/media/storage'
import { readFileAsDataUrl } from '../home/inlineMedia'
import { formatBytes, readImageFile } from '../home/imageValidation'
import { LOGO_STORAGE_ROOT } from './constants'
import { SettingsError } from './errors'
import type { SettingsImage, SettingsNewImage } from './types'

/**
 * The Settings page reuses the Home image gate (extension, MIME, file signature,
 * decode, dimensions, aspect, and in-browser optimization) but owns its Storage
 * folder and document writes. Components never import `firebase/storage`.
 */
export type SettingsImageFileResult =
  | { ok: true; image: SettingsNewImage }
  | { ok: false; message: string }

export async function readSettingsImageFile(
  file: File,
): Promise<SettingsImageFileResult> {
  const result = await readImageFile(file, 'hero')
  if (!result.ok) return result

  return {
    ok: true,
    image: { kind: 'new', ...result.image },
  }
}

export function formatSettingsBytes(bytes: number): string {
  return formatBytes(bytes)
}

export async function uploadSettingsImage(
  selection: SettingsNewImage,
  alt: string,
): Promise<SettingsImage> {
  return uploadImageObject({
    folder: LOGO_STORAGE_ROOT,
    file: selection.file,
    width: selection.width,
    height: selection.height,
    contentType: selection.contentType,
    alt,
  })
}

export async function toInlineSettingsImage(
  selection: SettingsNewImage,
  alt: string,
): Promise<SettingsImage> {
  let url: string
  try {
    url = await readFileAsDataUrl(selection.file)
  } catch {
    throw new SettingsError('upload', 'The logo could not be prepared for saving.')
  }

  // Only raster data URLs are allowed; never store an SVG or a script-bearing
  // data URL that the public site would put into an <img src>.
  if (!/^data:image\/(?:jpeg|png|webp);base64,/i.test(url)) {
    throw new SettingsError('upload', 'The logo could not be prepared for saving.')
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

export async function deleteSettingsObject(path: string): Promise<void> {
  return deleteImageObject(path)
}

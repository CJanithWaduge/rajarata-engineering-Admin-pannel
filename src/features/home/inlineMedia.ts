import { HomeError } from './errors'
import type { HomeImage, NewImage } from './types'

/**
 * Reads a validated file as a data URL. Used only by the inline-media mode,
 * where the image is stored in Firestore instead of Firebase Storage.
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('unexpected-result'))
      }
    }
    reader.onerror = () => reject(reader.error ?? new Error('read-failed'))
    reader.readAsDataURL(file)
  })
}

/** Converts a validated image into the flat metadata stored on `site/home`. */
export async function toInlineImage(
  selection: NewImage,
  alt: string,
): Promise<HomeImage> {
  let url: string
  try {
    url = await readFileAsDataUrl(selection.file)
  } catch {
    throw new HomeError('upload', 'The image could not be prepared for saving.')
  }

  // Only raster data URLs are allowed; never store an SVG or a script-bearing
  // data URL that the public site would put into an <img src>.
  if (!/^data:image\/(?:jpeg|png|webp);base64,/i.test(url)) {
    throw new HomeError('upload', 'The image could not be prepared for saving.')
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

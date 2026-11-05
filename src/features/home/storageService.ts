import { deleteImageObject, uploadImageObject } from '../../lib/media/storage'
import { STORAGE_ROOTS, type ImageKind } from './constants'
import type { HomeImage, ImageContentType } from './types'

export type UploadHomeImageInput = {
  file: File
  kind: ImageKind
  slot?: number
  width: number
  height: number
  contentType: ImageContentType
  alt: string
}

/**
 * Feature-aware wrapper over the shared Storage uploader: it owns the Home
 * folder layout (`home/hero`, `home/projects/{slot}`) and nothing else.
 */
export async function uploadHomeImage(input: UploadHomeImageInput): Promise<HomeImage> {
  const folder =
    input.kind === 'hero'
      ? STORAGE_ROOTS.hero
      : `${STORAGE_ROOTS.projects}/${input.slot ?? 1}`

  return uploadImageObject({
    folder,
    file: input.file,
    width: input.width,
    height: input.height,
    contentType: input.contentType,
    alt: input.alt,
  })
}

export async function deleteHomeObject(path: string): Promise<void> {
  return deleteImageObject(path)
}

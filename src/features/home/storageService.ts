import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../../lib/firebase'
import { EXTENSION_BY_TYPE, STORAGE_ROOTS, type ImageKind } from './constants'
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

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Uploads one already-validated image. Callers must never reach this function
 * with a file that failed `readImageFile`.
 */
export async function uploadHomeImage(input: UploadHomeImageInput): Promise<HomeImage> {
  const extension = EXTENSION_BY_TYPE[input.contentType]
  const folder =
    input.kind === 'hero'
      ? STORAGE_ROOTS.hero
      : `${STORAGE_ROOTS.projects}/${input.slot ?? 1}`
  const path = `${folder}/${createId()}.${extension}`
  const objectRef = ref(storage, path)

  await uploadBytes(objectRef, input.file, {
    contentType: input.contentType,
    cacheControl: 'public,max-age=31536000,immutable',
  })
  const url = await getDownloadURL(objectRef)

  return {
    url,
    path,
    alt: input.alt,
    width: input.width,
    height: input.height,
    size: input.file.size,
    contentType: input.contentType,
  }
}

export async function deleteHomeObject(path: string): Promise<void> {
  if (!path) return
  await deleteObject(ref(storage, path))
}

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage'
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

/**
 * A stalled Storage request never settles — for example when the project has no
 * bucket yet and the browser SDK keeps retrying a blocked request. Without a
 * ceiling the form stays on "Saving…" forever. The upload is failed as soon as
 * no bytes have moved for 20 s, while a slow-but-progressing upload keeps
 * going; the download-URL lookup gets its own ceiling.
 */
const STALL_TIMEOUT_MS = 20_000
const DOWNLOAD_URL_TIMEOUT_MS = 20_000

type CodedError = Error & { code: string }

function timeoutError(): CodedError {
  const error = new Error('The image upload timed out.') as CodedError
  error.code = 'storage/timeout'
  return error
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      onTimeout()
      reject(timeoutError())
    }, ms)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error: unknown) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
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

  const task = uploadBytesResumable(objectRef, input.file, {
    contentType: input.contentType,
    cacheControl: 'public,max-age=31536000,immutable',
  })

  await new Promise<void>((resolve, reject) => {
    let stallTimer: ReturnType<typeof setTimeout>
    let lastBytes = -1

    const clear = () => clearTimeout(stallTimer)

    const arm = () => {
      clear()
      stallTimer = setTimeout(() => {
        // Cancelling produces a `storage/canceled` error; the rejection below
        // is the clearer signal, and the later error callback is a no-op.
        task.cancel()
        reject(timeoutError())
      }, STALL_TIMEOUT_MS)
    }

    task.on(
      'state_changed',
      (snapshot) => {
        if (snapshot.bytesTransferred > lastBytes) {
          lastBytes = snapshot.bytesTransferred
          arm()
        }
      },
      (error) => {
        clear()
        reject(error)
      },
      () => {
        clear()
        resolve()
      },
    )

    arm()
  })

  const url = await withTimeout(
    getDownloadURL(objectRef),
    DOWNLOAD_URL_TIMEOUT_MS,
    () => {},
  )

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

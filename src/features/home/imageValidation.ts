import {
  ALLOWED_CONTENT_TYPES,
  ALLOWED_EXTENSIONS,
  IMAGE_RULES,
  type ImageKind,
} from './constants'
import type { ImageContentType } from './types'

const ALLOWED_EXTENSION_SET = new Set<string>(ALLOWED_EXTENSIONS)
const ALLOWED_CONTENT_TYPE_SET = new Set<string>(ALLOWED_CONTENT_TYPES)

export type ImageCandidate = {
  name: string
  type: string
  size: number
  width: number
  height: number
}

export type ValidatedImage = {
  file: File
  /** Local preview URL. The caller owns it and must revoke it. */
  previewUrl: string
  width: number
  height: number
  size: number
  contentType: ImageContentType
}

export type ImageFileResult =
  | { ok: true; image: ValidatedImage }
  | { ok: false; message: string }

type BasicResult =
  | { ok: true; contentType: ImageContentType }
  | { ok: false; message: string }

function failure(message: string): { ok: false; message: string } {
  return { ok: false, message }
}

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase()
}

function extensionMatches(extension: string, contentType: ImageContentType): boolean {
  if (contentType === 'image/jpeg') return extension === 'jpg' || extension === 'jpeg'
  if (contentType === 'image/png') return extension === 'png'
  return extension === 'webp'
}

function validateBasics(candidate: ImageCandidate, kind: ImageKind): BasicResult {
  const rule = IMAGE_RULES[kind]
  const extension = extensionOf(candidate.name)

  if (!ALLOWED_EXTENSION_SET.has(extension)) {
    return failure(
      `${rule.label} must be a JPEG, PNG, or WebP file (.jpg, .jpeg, .png, or .webp).`,
    )
  }

  const declared = candidate.type.toLowerCase()
  if (!ALLOWED_CONTENT_TYPE_SET.has(declared)) {
    return failure(`${rule.label} type is not supported. Choose a JPEG, PNG, or WebP file.`)
  }

  const contentType = declared as ImageContentType
  if (!extensionMatches(extension, contentType)) {
    return failure(
      `${rule.label} type does not match its extension. Choose a JPEG, PNG, or WebP file.`,
    )
  }

  if (candidate.size <= 0) {
    return failure(`${rule.label} is empty. Choose a different file.`)
  }

  if (candidate.size > rule.maxBytes) {
    return failure(`${rule.label} is too large. The maximum is ${rule.maxBytesLabel}.`)
  }

  return { ok: true, contentType }
}

/**
 * Pure metadata check. Used by the UI after decoding and by the tests, so the
 * extension, MIME, byte-size, dimension, and aspect rules have one source.
 */
export function validateImageMetadata(
  candidate: ImageCandidate,
  kind: ImageKind,
): { ok: true; metadata: Omit<ValidatedImage, 'file' | 'previewUrl'> } | { ok: false; message: string } {
  const basics = validateBasics(candidate, kind)
  if (!basics.ok) return basics

  const rule = IMAGE_RULES[kind]

  if (candidate.width < rule.minWidth || candidate.height < rule.minHeight) {
    return failure(
      `${rule.label} is too small. Use at least ${rule.minWidth} x ${rule.minHeight} px.`,
    )
  }

  if (candidate.width > rule.maxWidth || candidate.height > rule.maxHeight) {
    return failure(
      `${rule.label} is too large in pixel dimensions. Use at most ${rule.maxWidth} x ${rule.maxHeight} px.`,
    )
  }

  const aspect = candidate.width / candidate.height
  if (aspect < rule.minAspect || aspect > rule.maxAspect) {
    return failure(
      `${rule.label} has an unsupported shape. Use an aspect ratio between ${rule.minAspect.toFixed(2)}:1 and ${rule.maxAspect.toFixed(2)}:1.`,
    )
  }

  return {
    ok: true,
    metadata: {
      width: candidate.width,
      height: candidate.height,
      size: candidate.size,
      contentType: basics.contentType,
    },
  }
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let result = ''
  for (let index = offset; index < offset + length; index += 1) {
    result += String.fromCharCode(bytes[index] ?? 0)
  }
  return result
}

/** Reads the file signature rather than trusting the extension or MIME type. */
export function sniffContentType(bytes: Uint8Array): ImageContentType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png'
  }

  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    return 'image/webp'
  }

  return null
}

async function readDimensions(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    try {
      return { width: bitmap.width, height: bitmap.height }
    } finally {
      bitmap.close()
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('decode-failed'))
    }
    image.src = url
  })
}

/**
 * Full client-side gate: extension, MIME, signature, size, decode, dimensions,
 * and aspect ratio. A failed file never reaches Firebase Storage; the caller
 * only receives a preview URL when every check passed.
 */
export async function readImageFile(file: File, kind: ImageKind): Promise<ImageFileResult> {
  const basics = validateBasics(
    { name: file.name, type: file.type, size: file.size, width: 0, height: 0 },
    kind,
  )
  if (!basics.ok) return basics

  let bytes: Uint8Array
  try {
    bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  } catch {
    return failure('The file could not be read. Choose a different image.')
  }

  const sniffed = sniffContentType(bytes)
  if (!sniffed) {
    return failure('This file is not a valid JPEG, PNG, or WebP image.')
  }

  if (sniffed !== basics.contentType) {
    return failure('The file contents do not match its type. Choose a different image.')
  }

  let dimensions: { width: number; height: number }
  try {
    dimensions = await readDimensions(file)
  } catch {
    return failure('This image could not be decoded. Choose a different file.')
  }

  const result = validateImageMetadata(
    {
      name: file.name,
      type: file.type,
      size: file.size,
      width: dimensions.width,
      height: dimensions.height,
    },
    kind,
  )
  if (!result.ok) return result

  let previewUrl: string
  try {
    previewUrl = URL.createObjectURL(file)
  } catch {
    return failure('The image preview could not be created. Choose a different file.')
  }

  return {
    ok: true,
    image: {
      file,
      previewUrl,
      ...result.metadata,
    },
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

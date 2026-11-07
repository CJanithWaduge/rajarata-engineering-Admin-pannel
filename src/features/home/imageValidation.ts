import {
  ALLOWED_CONTENT_TYPES,
  ALLOWED_EXTENSIONS,
  COMPRESSION_TARGETS,
  IMAGE_RULES,
  INLINE_IMAGE_MAX_BYTES,
  INLINE_IMAGE_TARGETS,
  MAX_SOURCE_BYTES,
  MAX_SOURCE_BYTES_LABEL,
  MAX_SOURCE_PIXELS,
  MAX_SOURCE_PIXELS_LABEL,
  OPTIMIZE_ABOVE_BYTES,
  type ImageKind,
} from './constants'
import { compressImage } from './imageCompression'
import { INLINE_MEDIA_ENABLED } from './mediaMode'
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

export type ValidatedMetadata = {
  width: number
  height: number
  size: number
  contentType: ImageContentType
}

export type ValidatedImage = {
  file: File
  /** Local preview URL. The caller owns it and must revoke it. */
  previewUrl: string
  width: number
  height: number
  size: number
  contentType: ImageContentType
  /** Original byte size before any optimization. */
  originalSize: number
  /** True when the file was downscaled and re-encoded. */
  optimized: boolean
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

function validateBasics(
  candidate: ImageCandidate,
  kind: ImageKind,
  options: { enforceMaxBytes?: boolean } = {},
): BasicResult {
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

  if (options.enforceMaxBytes !== false && candidate.size > rule.maxBytes) {
    return failure(`${rule.label} is too large. The maximum is ${rule.maxBytesLabel}.`)
  }

  return { ok: true, contentType }
}

function validateMinimumDimensions(
  candidate: ImageCandidate,
  kind: ImageKind,
): { ok: true } | { ok: false; message: string } {
  const rule = IMAGE_RULES[kind]

  if (candidate.width < rule.minWidth || candidate.height < rule.minHeight) {
    return failure(
      `${rule.label} is too small. Use at least ${rule.minWidth} x ${rule.minHeight} px.`,
    )
  }

  return { ok: true }
}

function validateAspect(
  candidate: ImageCandidate,
  kind: ImageKind,
): { ok: true } | { ok: false; message: string } {
  const rule = IMAGE_RULES[kind]
  const aspect = candidate.width / candidate.height

  if (aspect < rule.minAspect || aspect > rule.maxAspect) {
    return failure(
      `${rule.label} has an unsupported shape. Use a ${rule.aspectLabel} aspect ratio (${rule.maxWidth} x ${rule.maxHeight} px).`,
    )
  }

  return { ok: true }
}

/**
 * Pure metadata check. Used by the UI after decoding and by the tests, so the
 * extension, MIME, byte-size, dimension, and aspect rules have one source.
 */
export function validateImageMetadata(
  candidate: ImageCandidate,
  kind: ImageKind,
  options: { requireMinimumDimensions?: boolean } = {},
): { ok: true; metadata: ValidatedMetadata } | { ok: false; message: string } {
  const basics = validateBasics(candidate, kind)
  if (!basics.ok) return basics

  if (options.requireMinimumDimensions !== false) {
    const minimum = validateMinimumDimensions(candidate, kind)
    if (!minimum.ok) return minimum
  }

  const rule = IMAGE_RULES[kind]
  if (candidate.width > rule.maxWidth || candidate.height > rule.maxHeight) {
    return failure(
      `${rule.label} is too large in pixel dimensions. Use at most ${rule.maxWidth} x ${rule.maxHeight} px.`,
    )
  }

  const aspect = validateAspect(candidate, kind)
  if (!aspect.ok) return aspect

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
 * Full client-side gate: extension, MIME, signature, decode, dimensions, and
 * aspect ratio. Files above the per-kind byte or dimension limit are optimized
 * in-browser and revalidated. A failed file is never saved to Storage or
 * Firestore; the caller only receives a preview URL when every check passed.
 */
export async function readImageFile(file: File, kind: ImageKind): Promise<ImageFileResult> {
  const basics = validateBasics(
    { name: file.name, type: file.type, size: file.size, width: 0, height: 0 },
    kind,
    { enforceMaxBytes: false },
  )
  if (!basics.ok) return basics

  if (file.size > MAX_SOURCE_BYTES) {
    return failure(
      `The image is too large to process. Choose a file of ${MAX_SOURCE_BYTES_LABEL} or less.`,
    )
  }

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

  const candidate = {
    name: file.name,
    type: file.type,
    size: file.size,
    width: dimensions.width,
    height: dimensions.height,
  }

  const minimum = validateMinimumDimensions(candidate, kind)
  if (!minimum.ok) return minimum

  if (dimensions.width * dimensions.height > MAX_SOURCE_PIXELS) {
    return failure(
      `The image resolution is too large to process. Use at most ${MAX_SOURCE_PIXELS_LABEL}.`,
    )
  }

  const aspect = validateAspect(candidate, kind)
  if (!aspect.ok) return aspect

  const target = INLINE_MEDIA_ENABLED ? INLINE_IMAGE_TARGETS[kind] : COMPRESSION_TARGETS[kind]
  const compressWhenAbove = INLINE_MEDIA_ENABLED
    ? INLINE_IMAGE_MAX_BYTES[kind]
    : OPTIMIZE_ABOVE_BYTES[kind]
  const needsCompression =
    file.size > compressWhenAbove ||
    dimensions.width > target.maxWidth ||
    dimensions.height > target.maxHeight

  let uploadFile = file
  let uploadDimensions = dimensions
  let optimized = false

  if (needsCompression) {
    const compressed = await compressImage(
      file,
      kind,
      dimensions,
      INLINE_MEDIA_ENABLED ? 'inline' : 'storage',
    ).catch(() => null)
    if (!compressed) {
      return failure('The image could not be optimized. Choose a smaller file.')
    }
    if (!compressed.ok) return compressed

    uploadFile = compressed.image.file
    uploadDimensions = {
      width: compressed.image.width,
      height: compressed.image.height,
    }
    optimized = true
  }

  const result = validateImageMetadata(
    {
      name: uploadFile.name,
      type: uploadFile.type,
      size: uploadFile.size,
      width: uploadDimensions.width,
      height: uploadDimensions.height,
    },
    kind,
    {
      // An inline downscale may drop below the source minimum; the original was
      // already checked above. Keep the byte/type/aspect checks in force.
      requireMinimumDimensions: !(INLINE_MEDIA_ENABLED && optimized),
    },
  )
  if (!result.ok) return result

  let previewUrl: string
  try {
    previewUrl = URL.createObjectURL(uploadFile)
  } catch {
    return failure('The image preview could not be created. Choose a different file.')
  }

  return {
    ok: true,
    image: {
      file: uploadFile,
      previewUrl,
      ...result.metadata,
      originalSize: file.size,
      optimized,
    },
  }
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

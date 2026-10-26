import type { ImageContentType } from './types'

export const CARD_COUNT = 3

export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const

export const ALLOWED_CONTENT_TYPES: ImageContentType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
]

export const EXTENSION_BY_TYPE: Record<ImageContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export type ImageKind = 'hero' | 'card'

export type ImageRule = {
  label: string
  maxBytes: number
  maxBytesLabel: string
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  minAspect: number
  maxAspect: number
}

/**
 * The single source of truth for image limits. Keep the byte limits in
 * `storage.rules` in sync when these change.
 */
export const IMAGE_RULES: Record<ImageKind, ImageRule> = {
  hero: {
    label: 'Hero image',
    maxBytes: 5 * 1024 * 1024,
    maxBytesLabel: '5 MB',
    minWidth: 1600,
    minHeight: 1000,
    maxWidth: 6000,
    maxHeight: 6000,
    minAspect: 1.2,
    maxAspect: 2,
  },
  card: {
    label: 'Project image',
    maxBytes: 3 * 1024 * 1024,
    maxBytesLabel: '3 MB',
    minWidth: 1000,
    minHeight: 700,
    maxWidth: 4000,
    maxHeight: 4000,
    minAspect: 1.4,
    maxAspect: 1.9,
  },
}

/**
 * Files above these limits are rejected before decoding so a very large source
 * cannot exhaust memory. Files above the per-kind byte limit are optimized
 * instead, provided they fit within these source caps.
 */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024
export const MAX_SOURCE_BYTES_LABEL = '25 MB'
export const MAX_SOURCE_PIXELS = 60_000_000
export const MAX_SOURCE_PIXELS_LABEL = '60 megapixels'

/**
 * Downscale ceiling for optimized uploads. The public cards render at roughly
 * 384 x 224 px, so these keep retina quality without storing camera-sized files.
 */
export const COMPRESSION_TARGETS: Record<ImageKind, { maxWidth: number; maxHeight: number }> = {
  hero: { maxWidth: 2400, maxHeight: 1600 },
  card: { maxWidth: 1800, maxHeight: 1200 },
}

/**
 * Photos above these sizes are downscaled/re-encoded even when they are under
 * the storage hard cap. A 4 MB hero is legal but slow to upload on a typical
 * connection, and the public page never renders it at that resolution.
 * Well-optimized files (for example a 1600x900 WebP under 200 KB) pass through
 * untouched.
 */
export const OPTIMIZE_ABOVE_BYTES: Record<ImageKind, number> = {
  hero: 600 * 1024,
  card: 400 * 1024,
}

/** Tried in order until the encoded file fits the per-kind byte limit. */
export const COMPRESSION_QUALITIES = [0.82, 0.7, 0.58] as const

/**
 * Inline-media fallback used when Firebase Storage is not provisioned (for
 * example on the Spark plan). The encoded images are stored as data URLs inside
 * the `site/home` document, which Firestore caps at 1 MiB, so these limits are
 * deliberately much smaller than the Storage limits. The four worst-case data
 * URLs together are about 580 KB, leaving plenty of room for the card text. */
export const INLINE_IMAGE_TARGETS: Record<
  ImageKind,
  { maxWidth: number; maxHeight: number }
> = {
  hero: { maxWidth: 1600, maxHeight: 1200 },
  card: { maxWidth: 1200, maxHeight: 900 },
}

export const INLINE_IMAGE_MAX_BYTES: Record<ImageKind, number> = {
  hero: 160 * 1024,
  card: 90 * 1024,
}

export const INLINE_IMAGE_MAX_BYTES_LABEL: Record<ImageKind, string> = {
  hero: '160 KB',
  card: '90 KB',
}

export const INLINE_COMPRESSION_QUALITIES = [0.7, 0.6, 0.5, 0.4, 0.3, 0.22] as const

/** Leaves headroom below Firestore's 1 MiB document limit. */
export const INLINE_MEDIA_DOC_BUDGET = 900_000



export const TEXT_LIMITS = {
  alt: 160,
  category: 40,
  venue: 80,
  topic: 90,
  tag: 40,
} as const

export const STORAGE_ROOTS = {
  hero: 'home/hero',
  projects: 'home/projects',
} as const

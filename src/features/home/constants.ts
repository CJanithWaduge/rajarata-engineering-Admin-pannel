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

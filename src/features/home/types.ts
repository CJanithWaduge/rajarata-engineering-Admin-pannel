export type ImageContentType = 'image/jpeg' | 'image/png' | 'image/webp'

/** One image stored in Firebase Storage, plus the metadata the document keeps. */
export type HomeImage = {
  url: string
  path: string
  alt: string
  width: number
  height: number
  size: number
  contentType: string
}

export type FeaturedProject = {
  image: HomeImage
  category: string
  venue: string
  topic: string
  tag: string
}

export type HomeContent = {
  hero: HomeImage
  featuredProjects: FeaturedProject[]
  updatedAt: Date | null
  updatedBy: string | null
}

/** A validated file that has not been uploaded yet. */
export type NewImage = {
  kind: 'new'
  file: File
  /** Local object URL used only for the preview; never persisted. */
  previewUrl: string
  width: number
  height: number
  size: number
  contentType: ImageContentType
}

export type StoredImage = {
  kind: 'stored'
  image: HomeImage
}

export type NoImage = {
  kind: 'none'
}

export type ImageSelection = NewImage | StoredImage | NoImage

export type CardDraft = {
  image: ImageSelection
  alt: string
  category: string
  venue: string
  topic: string
  tag: string
}

export type CardTextField = 'alt' | 'category' | 'venue' | 'topic' | 'tag'

export type HomeDraft = {
  hero: {
    image: ImageSelection
    alt: string
  }
  cards: CardDraft[]
}

export type HomeStatus = 'loading' | 'ready' | 'saving' | 'error'

export type HomeErrorCode =
  | 'permission-denied'
  | 'not-ready'
  | 'network'
  | 'validation'
  | 'upload'
  | 'unknown'

export type SiteSettings = {
  phone: string
  whatsapp: string
  email: string
  address: string
  facebookUrl: string
  facebookLabel: string
  location: string
  mapEmbedUrl: string
  logoUrl: string
  logoAlt: string
  logoPath: string
  logoWidth: number
  logoHeight: number
  logoSize: number
  logoContentType: string
  updatedAt: Date | null
  updatedBy: string | null
}

export type SettingsFormValues = {
  phone: string
  whatsapp: string
  email: string
  address: string
  facebookUrl: string
  facebookLabel: string
  location: string
  mapEmbedUrl: string
  logoAlt: string
}

export type SettingsFieldKey = keyof SettingsFormValues
export type SettingsStatus = 'loading' | 'ready' | 'saving' | 'error'
export type SettingsErrorCode =
  | 'permission-denied'
  | 'not-ready'
  | 'network'
  | 'validation'
  | 'upload'
  | 'invalid-document'
  | 'unknown'

/** One stored logo image plus the metadata the document keeps. */
export type SettingsImage = {
  url: string
  path: string
  alt: string
  width: number
  height: number
  size: number
  contentType: string
}

/** A validated file that has not been uploaded yet. */
export type SettingsNewImage = {
  kind: 'new'
  file: File
  /** Local object URL used only for the preview; never persisted. */
  previewUrl: string
  width: number
  height: number
  size: number
  contentType: 'image/jpeg' | 'image/png' | 'image/webp'
  /** Original byte size before any optimization. */
  originalSize: number
  /** True when the file was downscaled and re-encoded. */
  optimized: boolean
}

export type SettingsStoredImage = {
  kind: 'stored'
  image: SettingsImage
}

export type SettingsNoImage = {
  kind: 'none'
}

export type SettingsImageSelection =
  | SettingsNewImage
  | SettingsStoredImage
  | SettingsNoImage

/** Complete save payload: validated text plus the chosen logo image. */
export type SettingsDraft = SettingsFormValues & {
  image: SettingsImageSelection
}

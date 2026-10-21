export type SiteSettings = {
  phone: string
  whatsapp: string
  email: string
  address: string
  facebookUrl: string
  facebookLabel: string
  location: string
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
}

export type SettingsFieldKey = keyof SettingsFormValues
export type SettingsStatus = 'loading' | 'ready' | 'saving' | 'error'
export type SettingsErrorCode =
  | 'permission-denied'
  | 'not-ready'
  | 'network'
  | 'validation'
  | 'unknown'

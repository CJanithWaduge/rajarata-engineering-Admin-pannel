import type { SiteSettings, SettingsFormValues } from './types'

export const EMPTY_SETTINGS: SiteSettings = {
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  facebookUrl: '',
  facebookLabel: '',
  location: '',
  mapEmbedUrl: '',
  logoUrl: '',
  logoAlt: '',
  logoPath: '',
  logoWidth: 0,
  logoHeight: 0,
  logoSize: 0,
  logoContentType: '',
  updatedAt: null,
  updatedBy: null,
}

export type SettingsFieldMeta = {
  key: SettingsFieldKey
  label: string
  hint?: string
  type: 'text' | 'textarea'
  placeholder?: string
  autocomplete?: string
  group: 'contact' | 'location' | 'links'
}

import type { SettingsFieldKey } from './types'

export const SETTINGS_FIELDS: SettingsFieldMeta[] = [
  {
    key: 'phone',
    label: 'Phone number',
    hint: 'Sri Lankan number: 0771234567 (10 digits) or +94771234567. Leave empty to hide it.',
    type: 'text',
    placeholder: '0771234567',
    autocomplete: 'tel',
    group: 'contact',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp number',
    hint: 'Sri Lankan number: 0771234567 or +94771234567. Saved as 94771234567 for wa.me links.',
    type: 'text',
    placeholder: '0771234567',
    autocomplete: 'tel',
    group: 'contact',
  },
  {
    key: 'email',
    label: 'Email address',
    hint: 'Shown in the footer and on the Contact page.',
    type: 'text',
    autocomplete: 'email',
    group: 'contact',
  },
  {
    key: 'address',
    label: 'Business address',
    hint: 'Multi-line address. Leave empty to hide it on the public site.',
    type: 'textarea',
    group: 'location',
  },
  {
    key: 'location',
    label: 'Location label',
    hint: 'Short label shown in listings.',
    type: 'text',
    group: 'location',
  },
  {
    key: 'mapEmbedUrl',
    label: 'Google Maps embed',
    hint: 'Paste the embed code from Google Maps (Share → Embed a map), or just its https://www.google.com/maps/embed?... URL. Leave empty to keep the default map.',
    type: 'textarea',
    group: 'location',
  },
  {
    key: 'facebookUrl',
    label: 'Facebook page URL',
    hint: 'Full https:// URL to the page.',
    type: 'text',
    group: 'links',
  },
  {
    key: 'facebookLabel',
    label: 'Facebook link text',
    hint: 'Optional. Shown in the footer instead of the page URL.',
    type: 'text',
    group: 'links',
  },
]

export const EMPTY_FORM_VALUES: SettingsFormValues = {
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  facebookUrl: '',
  facebookLabel: '',
  location: '',
  mapEmbedUrl: '',
  logoAlt: '',
}

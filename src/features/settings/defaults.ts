import type { SiteSettings, SettingsFormValues } from './types'

export const EMPTY_SETTINGS: SiteSettings = {
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  facebookUrl: '',
  location: '',
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
    hint: 'International format, including the country code.',
    type: 'text',
    autocomplete: 'tel',
    group: 'contact',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp number',
    hint: 'Digits only, including the country code.',
    type: 'text',
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
    key: 'facebookUrl',
    label: 'Facebook page URL',
    hint: 'Full https:// URL to the page.',
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
  location: '',
}

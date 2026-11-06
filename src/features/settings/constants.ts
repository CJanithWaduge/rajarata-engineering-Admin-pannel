import { IMAGE_RULES } from '../home/constants'

export const LOGO_STORAGE_ROOT = 'settings/logo'

/** Leaves headroom below Firestore's 1 MiB document limit when the logo is
 * stored inline as a data URL. */
export const LOGO_INLINE_MEDIA_DOC_BUDGET = 900_000

/** Uses the Home logo image limits: exactly 1080 x 1080 px with a 1:1 aspect ratio. */
export const LOGO_IMAGE_RULE = IMAGE_RULES.logo

export type SettingsFieldMeta = {
  key: SettingsFieldKey
  label: string
  hint?: string
  type: 'text' | 'textarea'
  placeholder?: string
  autocomplete?: string
  group: 'contact' | 'location' | 'links'
}

import type { SettingsFieldKey, SettingsFormValues } from './types'

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
  logoAlt: '',
}

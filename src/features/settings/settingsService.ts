import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { INLINE_MEDIA_ENABLED } from '../home/mediaMode'
import { LOGO_INLINE_MEDIA_DOC_BUDGET } from './constants'
import { SettingsError, logSettingsError, toSettingsError } from './errors'
import { deleteSettingsObject, toInlineSettingsImage, uploadSettingsImage } from './media'
import { settingsSchema } from './schema'
import type { SettingsDraft, SettingsImage, SettingsImageSelection } from './types'

const SETTINGS_REF = doc(db, 'site', 'settings')

function toSiteSettings(data: Record<string, unknown> | undefined): SiteSettings {
  const read = (key: keyof SiteSettings): string | number | null => {
    const value = data?.[key]
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value
    if (value instanceof Timestamp) return ''
    return null
  }

  const updatedAtValue = data?.updatedAt
  const updatedByValue = data?.updatedBy

  return {
    phone: typeof read('phone') === 'string' ? read('phone') as string : '',
    whatsapp: typeof read('whatsapp') === 'string' ? read('whatsapp') as string : '',
    email: typeof read('email') === 'string' ? read('email') as string : '',
    address: typeof read('address') === 'string' ? read('address') as string : '',
    facebookUrl: typeof read('facebookUrl') === 'string' ? read('facebookUrl') as string : '',
    facebookLabel:
      typeof read('facebookLabel') === 'string'
        ? read('facebookLabel') as string
        : '',
    location: typeof read('location') === 'string' ? read('location') as string : '',
    logoUrl: typeof read('logoUrl') === 'string' ? read('logoUrl') as string : '',
    logoAlt: typeof read('logoAlt') === 'string' ? read('logoAlt') as string : '',
    logoPath: typeof read('logoPath') === 'string' ? read('logoPath') as string : '',
    logoWidth: typeof read('logoWidth') === 'number' ? (read('logoWidth') as number) : 0,
    logoHeight: typeof read('logoHeight') === 'number' ? (read('logoHeight') as number) : 0,
    logoSize: typeof read('logoSize') === 'number' ? (read('logoSize') as number) : 0,
    logoContentType:
      typeof read('logoContentType') === 'string'
        ? read('logoContentType') as string
        : '',
    updatedAt: updatedAtValue instanceof Timestamp ? updatedAtValue.toDate() : null,
    updatedBy: typeof updatedByValue === 'string' ? updatedByValue : null,
  }
}

export interface SiteSettings {
  phone: string
  whatsapp: string
  email: string
  address: string
  facebookUrl: string
  facebookLabel: string
  location: string
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

export async function getSettings(): Promise<{ settings: SiteSettings; exists: boolean }> {
  try {
    const snapshot = await getDoc(SETTINGS_REF)
    if (!snapshot.exists()) {
      return { settings: emptySettings(), exists: false }
    }

    return {
      settings: toSiteSettings(snapshot.data() as Record<string, unknown>),
      exists: true,
    }
  } catch (error) {
    const mapped = toSettingsError(error)
    logSettingsError(mapped.code, (error as { code?: string } | null)?.code)
    throw mapped
  }
}

function emptySettings(): SiteSettings {
  return {
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    facebookUrl: '',
    facebookLabel: '',
    location: '',
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
}

type ResolvedImage = {
  image: SettingsImage
  uploaded: boolean
}

/** Empty logo means "keep the public page logo". */
function emptyLogoImage(): SettingsImage {
  return {
    url: '',
    path: '',
    alt: '',
    width: 0,
    height: 0,
    size: 0,
    contentType: '',
  }
}

function hasImage(selection: SettingsImageSelection | undefined): boolean {
  if (!selection) return false
  if (selection.kind === 'new') return true
  if (selection.kind === 'stored') return selection.image.url.trim() !== ''
  return false
}

async function resolveLogoImage(
  selection: SettingsImageSelection | undefined,
  alt: string,
): Promise<ResolvedImage> {
  if (!selection || !hasImage(selection)) {
    return { image: emptyLogoImage(), uploaded: false }
  }

  // An admin-supplied logo still needs alt text: the public page has no
  // built-in image to fall back to.
  if (alt.trim() === '') {
    throw new SettingsError(
      'validation',
      'Logo alt text is required when a logo image is set.',
    )
  }

  if (selection.kind === 'stored') {
    return { image: { ...selection.image, alt }, uploaded: false }
  }

  if (selection.kind === 'none') {
    return { image: emptyLogoImage(), uploaded: false }
  }

  if (INLINE_MEDIA_ENABLED) {
    return { image: await toInlineSettingsImage(selection, alt), uploaded: false }
  }

  const image = await uploadSettingsImage(selection, alt)
  return { image, uploaded: true }
}

/**
 * Validates the text, resolves the logo image (inline data URL or a Storage
 * upload), writes the settings document with { merge: true }, then removes the
 * Storage object the document no longer references. A failed write rolls back
 * a new upload.
 */
export async function saveSettings(
  draft: SettingsDraft,
  uid: string,
  previous: SiteSettings | null,
): Promise<SiteSettings> {
  const parsed = settingsSchema.safeParse(draft)

  if (!parsed.success) {
    throw new SettingsError(
      'validation',
      parsed.error.issues[0]?.message ?? undefined,
    )
  }

  const values = parsed.data
  let uploaded: SettingsImage | null = null

  try {
    const resolved = await resolveLogoImage(draft.image, values.logoAlt)
    if (resolved.uploaded) uploaded = resolved.image

    if (
      INLINE_MEDIA_ENABLED &&
      resolved.image.url.length > LOGO_INLINE_MEDIA_DOC_BUDGET
    ) {
      throw new SettingsError(
        'validation',
        'The logo is too large to store without Firebase Storage. Choose a smaller or simpler image.',
      )
    }

    await setDoc(
      SETTINGS_REF,
      {
        phone: values.phone,
        whatsapp: values.whatsapp,
        email: values.email,
        address: values.address,
        facebookUrl: values.facebookUrl,
        facebookLabel: values.facebookLabel,
        location: values.location,
        logoUrl: resolved.image.url,
        logoAlt: resolved.image.alt,
        logoPath: resolved.image.path,
        logoWidth: resolved.image.width,
        logoHeight: resolved.image.height,
        logoSize: resolved.image.size,
        logoContentType: resolved.image.contentType,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true },
    )

    const oldPath = previous?.logoPath ?? ''
    if (oldPath !== '' && oldPath !== resolved.image.path) {
      await Promise.allSettled([deleteSettingsObject(oldPath)])
    }

    return {
      phone: values.phone,
      whatsapp: values.whatsapp,
      email: values.email,
      address: values.address,
      facebookUrl: values.facebookUrl,
      facebookLabel: values.facebookLabel,
      location: values.location,
      logoUrl: resolved.image.url,
      logoAlt: resolved.image.alt,
      logoPath: resolved.image.path,
      logoWidth: resolved.image.width,
      logoHeight: resolved.image.height,
      logoSize: resolved.image.size,
      logoContentType: resolved.image.contentType,
      updatedAt: new Date(),
      updatedBy: uid,
    }
  } catch (error) {
    if (uploaded) {
      await Promise.allSettled([deleteSettingsObject(uploaded.path)])
    }
    throw toSettingsError(error)
  }
}

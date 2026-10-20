import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { EMPTY_SETTINGS } from './defaults'
import { SettingsError, logSettingsError, mapFirestoreErrorToSettingsCode } from './errors'
import { normaliseSettings, settingsSchema } from './schema'
import type { SettingsFormValues, SiteSettings } from './types'

const SETTINGS_REF = doc(db, 'site', 'settings')

function toSiteSettings(data: Record<string, unknown> | undefined): SiteSettings {
  const read = (key: 'phone' | 'whatsapp' | 'email' | 'address' | 'facebookUrl' | 'location'): string => {
    const value = data?.[key]
    if (typeof value === 'string') return value
    if (value instanceof Timestamp) return ''
    return ''
  }

  const updatedAtValue = data?.updatedAt
  const updatedByValue = data?.updatedBy

  return {
    phone: read('phone'),
    whatsapp: read('whatsapp'),
    email: read('email'),
    address: read('address'),
    facebookUrl: read('facebookUrl'),
    location: read('location'),
    updatedAt: updatedAtValue instanceof Timestamp ? updatedAtValue.toDate() : null,
    updatedBy: typeof updatedByValue === 'string' ? updatedByValue : null,
  }
}

export async function getSettings(): Promise<{ settings: SiteSettings; exists: boolean }> {
  try {
    const snapshot = await getDoc(SETTINGS_REF)
    if (!snapshot.exists()) {
      return { settings: EMPTY_SETTINGS, exists: false }
    }
    return { settings: toSiteSettings(snapshot.data()), exists: true }
  } catch (error) {
    const code = (error as { code?: string } | null)?.code
    const mapped = mapFirestoreErrorToSettingsCode(code)
    logSettingsError(mapped, code)
    throw new SettingsError(mapped)
  }
}

export async function saveSettings(values: SettingsFormValues, uid: string): Promise<SiteSettings> {
  const parsed = settingsSchema.safeParse(values)
  if (!parsed.success) {
    throw new SettingsError('validation')
  }

  const normalised = normaliseSettings(parsed.data)

  try {
    await setDoc(
      SETTINGS_REF,
      {
        ...normalised,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      },
      { merge: true },
    )
  } catch (error) {
    const code = (error as { code?: string } | null)?.code
    const mapped = mapFirestoreErrorToSettingsCode(code)
    logSettingsError(mapped, code)
    throw new SettingsError(mapped)
  }

  return {
    ...normalised,
    updatedAt: new Date(),
    updatedBy: uid,
  }
}

import type { SettingsErrorCode } from './types'

export class SettingsError extends Error {
  code: SettingsErrorCode

  constructor(code: SettingsErrorCode, message?: string) {
    super(message ?? mapSettingsError(code))
    this.name = 'SettingsError'
    this.code = code
  }
}

const messages: Record<SettingsErrorCode, string> = {
  'permission-denied': 'You do not have permission to change site settings. Check that firestore.rules is deployed.',
  'not-ready': 'Firestore is not set up for this project; the settings document could not be reached.',
  network: 'Network error. Check your connection and try again.',
  validation: 'Some settings values are invalid. Check the fields below.',
  unknown: 'Could not save site settings. Please try again.',
}

export function mapSettingsError(code: SettingsErrorCode): string {
  return messages[code]
}

export function mapFirestoreErrorToSettingsCode(code?: string): SettingsErrorCode {
  const raw = code ?? ''
  if (raw === 'permission-denied') return 'permission-denied'
  if (raw === 'failed-precondition' || raw === 'not-found') return 'not-ready'
  if (raw === 'unavailable' || raw === 'deadline-exceeded') return 'network'
  if (raw === 'unauthenticated' || raw === 'cancelled') return 'network'
  return 'unknown'
}

export function logSettingsError(code: SettingsErrorCode, raw?: string) {
  if (import.meta.env.MODE === 'test') return
  console.error(`[settings] ${code} (raw: ${raw ?? 'unknown'})`)
}

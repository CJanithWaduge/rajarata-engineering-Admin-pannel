import type { AboutErrorCode } from './types'

export class AboutError extends Error {
  code: AboutErrorCode

  constructor(code: AboutErrorCode, message?: string) {
    super(message ?? mapAboutError(code))
    this.name = 'AboutError'
    this.code = code
  }
}

const messages: Record<AboutErrorCode, string> = {
  'permission-denied':
    'You do not have permission to change about page content. Check that firestore.rules is deployed.',
  'not-ready':
    'Firestore is not set up for this project; about page content could not be reached.',
  network: 'Network error. Check your connection and try again.',
  validation: 'Some about page values are invalid. Check the fields below.',
  upload: 'The hero image could not be uploaded. Please try again.',
  'invalid-document':
    'The stored about page content is incomplete or invalid. Repair it in Firestore before editing here.',
  unknown: 'Could not save about page content. Please try again.',
}

export function mapAboutError(code: AboutErrorCode): string {
  return messages[code]
}

export function mapFirestoreErrorToAboutCode(
  code?: string,
): AboutErrorCode {
  const raw = code ?? ''
  if (raw === 'permission-denied') return 'permission-denied'
  if (raw === 'failed-precondition' || raw === 'not-found') return 'not-ready'
  if (raw === 'unavailable' || raw === 'deadline-exceeded') return 'network'
  if (raw === 'unauthenticated' || raw === 'cancelled') return 'network'
  if (raw.startsWith('storage/')) return 'upload'
  return 'unknown'
}

export function toAboutError(error: unknown): AboutError {
  if (error instanceof AboutError) return error

  const raw = (error as { code?: string } | null)?.code ?? ''
  const code = mapFirestoreErrorToAboutCode(raw)
  logAboutError(code, raw)
  return new AboutError(code)
}

export function logAboutError(code: AboutErrorCode, raw?: string) {
  if (import.meta.env.MODE === 'test') return
  console.error(`[about] ${code} (raw: ${raw ?? 'unknown'})`)
}

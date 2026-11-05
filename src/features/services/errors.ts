import type { ServicesErrorCode } from './types'

export class ServicesError extends Error {
  code: ServicesErrorCode

  constructor(code: ServicesErrorCode, message?: string) {
    super(message ?? mapServicesError(code))
    this.name = 'ServicesError'
    this.code = code
  }
}

const messages: Record<ServicesErrorCode, string> = {
  'permission-denied':
    'You do not have permission to change services page content. Check that firestore.rules is deployed.',
  'not-ready':
    'Firestore is not set up for this project; services page content could not be reached.',
  network: 'Network error. Check your connection and try again.',
  validation: 'Some services page values are invalid. Check the fields below.',
  'invalid-document':
    'The stored services page content is incomplete or invalid. Repair it in Firestore before editing here.',
  unknown: 'Could not save services page content. Please try again.',
}

export function mapServicesError(code: ServicesErrorCode): string {
  return messages[code]
}

export function mapFirestoreErrorToServicesCode(
  code?: string,
): ServicesErrorCode {
  const raw = code ?? ''
  if (raw === 'permission-denied') return 'permission-denied'
  if (raw === 'failed-precondition' || raw === 'not-found') return 'not-ready'
  if (raw === 'unavailable' || raw === 'deadline-exceeded') return 'network'
  if (raw === 'unauthenticated' || raw === 'cancelled') return 'network'
  return 'unknown'
}

export function toServicesError(error: unknown): ServicesError {
  if (error instanceof ServicesError) return error

  const raw = (error as { code?: string } | null)?.code ?? ''
  const code = mapFirestoreErrorToServicesCode(raw)
  logServicesError(code, raw)
  return new ServicesError(code)
}

export function logServicesError(code: ServicesErrorCode, raw?: string) {
  if (import.meta.env.MODE === 'test') return
  console.error(`[services] ${code} (raw: ${raw ?? 'unknown'})`)
}

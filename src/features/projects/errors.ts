import type { ProjectsErrorCode } from './types'

export class ProjectsError extends Error {
  code: ProjectsErrorCode

  constructor(code: ProjectsErrorCode, message?: string) {
    super(message ?? mapProjectsError(code))
    this.name = 'ProjectsError'
    this.code = code
  }
}

const messages: Record<ProjectsErrorCode, string> = {
  'permission-denied':
    'You do not have permission to change the projects page content. Check that firestore.rules is deployed.',
  'not-ready':
    'Firestore is not set up for this project; the projects page content could not be reached.',
  network: 'Network error. Check your connection and try again.',
  validation: 'Some projects page values are invalid. Check the fields below.',
  'invalid-document':
    'The stored projects page content is incomplete or invalid. Repair it in Firestore before editing here.',
  unknown: 'Could not save the projects page content. Please try again.',
}

export function mapProjectsError(code: ProjectsErrorCode): string {
  return messages[code]
}

export function mapFirestoreErrorToProjectsCode(
  code?: string,
): ProjectsErrorCode {
  const raw = code ?? ''
  if (raw === 'permission-denied') return 'permission-denied'
  if (raw === 'failed-precondition' || raw === 'not-found') return 'not-ready'
  if (raw === 'unavailable' || raw === 'deadline-exceeded') return 'network'
  if (raw === 'unauthenticated' || raw === 'cancelled') return 'network'
  return 'unknown'
}

export function toProjectsError(error: unknown): ProjectsError {
  if (error instanceof ProjectsError) return error

  const raw = (error as { code?: string } | null)?.code ?? ''
  const code = mapFirestoreErrorToProjectsCode(raw)
  logProjectsError(code, raw)
  return new ProjectsError(code)
}

export function logProjectsError(code: ProjectsErrorCode, raw?: string) {
  if (import.meta.env.MODE === 'test') return
  console.error(`[projects] ${code} (raw: ${raw ?? 'unknown'})`)
}

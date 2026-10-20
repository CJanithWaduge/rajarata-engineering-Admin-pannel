import { ROUTES } from './paths'

interface LocationLike {
  pathname?: unknown
  search?: unknown
  hash?: unknown
}

function isLocationLike(value: unknown): value is LocationLike {
  return typeof value === 'object' && value !== null && 'pathname' in value
}

/**
 * Returns a same-origin path to return to after login, or the dashboard.
 * Rejects external/protocol-relative URLs to avoid open redirects.
 */
export function getRedirectTarget(from: unknown): string {
  if (!isLocationLike(from)) {
    return ROUTES.dashboard
  }

  const { pathname, search, hash } = from

  if (
    typeof pathname !== 'string' ||
    !pathname.startsWith('/') ||
    pathname.startsWith('//') ||
    pathname === ROUTES.login
  ) {
    return ROUTES.dashboard
  }

  const safeSearch = typeof search === 'string' ? search : ''
  const safeHash = typeof hash === 'string' ? hash : ''

  return `${pathname}${safeSearch}${safeHash}`
}

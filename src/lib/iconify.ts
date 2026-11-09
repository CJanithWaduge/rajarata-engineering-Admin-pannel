/**
 * Iconify lookup shared by the admin icon picker.
 *
 * The admin panel searches Iconify's Material Symbols collection so an admin
 * can find any glyph by keyword (for example "cctv camera"). A result is stored
 * as `material-symbols:<slug>`; the public site recognises the same form and
 * renders it on demand, because its self-hosted Material Symbols subset only
 * holds the icons the build-time pages use.
 *
 * The slug is interpolated into a remote SVG URL, so it is limited to lowercase
 * kebab-case. Never widen this pattern without tightening the public parser.
 */
export const ICONIFY_COLLECTION = 'material-symbols'
export const ICONIFY_MATERIAL_PREFIX = `${ICONIFY_COLLECTION}:`

export const ICONIFY_ICON_NAME_PATTERN =
  /^material-symbols:[a-z0-9]+(?:-[a-z0-9]+)*$/

const SEARCH_ENDPOINT = 'https://api.iconify.design/search'
const RESULT_LIMIT = 24
const SEARCH_CACHE = new Map<string, IconifyIcon[]>()

export type IconifyIcon = {
  /** Fully-qualified Iconify name, e.g. `material-symbols:camera`. */
  value: string
  /** Human-readable label, e.g. `Camera`. */
  label: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isIconifyIconName(value: string): boolean {
  return ICONIFY_ICON_NAME_PATTERN.test(value)
}

/** Strips the collection prefix; a bare name is returned unchanged. */
export function iconifySlug(value: string): string {
  return value.startsWith(ICONIFY_MATERIAL_PREFIX)
    ? value.slice(ICONIFY_MATERIAL_PREFIX.length)
    : value
}

export function iconifyLabel(value: string): string {
  return iconifySlug(value)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/**
 * Remote SVG for a stored icon name. Returns `null` for anything that is not a
 * safe Iconify name, so callers can fall back to the self-hosted font.
 */
export function iconifyIconUrl(value: string, height = 24): string | null {
  if (!isIconifyIconName(value)) return null
  return `https://api.iconify.design/${ICONIFY_COLLECTION}/${iconifySlug(value)}.svg?height=${height}`
}

function parseIconNames(payload: unknown): string[] {
  if (!isRecord(payload) || !Array.isArray(payload.icons)) return []

  return payload.icons.filter(
    (icon): icon is string => typeof icon === 'string' && isIconifyIconName(icon),
  )
}

async function requestIconNames(
  term: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const params = new URLSearchParams({
    query: term,
    prefixes: ICONIFY_COLLECTION,
    limit: String(RESULT_LIMIT),
  })
  const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, {
    signal,
  })

  if (!response.ok) {
    throw new Error(`Icon search failed (${response.status}).`)
  }

  return parseIconNames(await response.json())
}

/**
 * Searches Iconify and returns at most 24 Material Symbols names.
 *
 * Iconify ANDs every word, so "cctv camera" finds nothing even though "camera"
 * has matches. When the full phrase is empty the individual words are tried,
 * last word first, which keeps multi-word searches useful.
 */
export async function searchMaterialIcons(
  query: string,
  signal?: AbortSignal,
): Promise<IconifyIcon[]> {
  const term = query.trim().toLowerCase()
  if (term.length < 2) return []

  const cached = SEARCH_CACHE.get(term)
  if (cached) return cached

  const attempts = [term, ...term.split(/\s+/).reverse()]
  let names: string[] = []

  for (const attempt of attempts) {
    if (attempt.length < 2) continue
    names = await requestIconNames(attempt, signal)
    if (names.length > 0) break
  }

  const seen = new Set<string>()
  const results: IconifyIcon[] = []

  for (const value of names) {
    if (seen.has(value)) continue
    seen.add(value)
    results.push({ value, label: iconifyLabel(value) })
  }

  SEARCH_CACHE.set(term, results)
  return results
}

/** Test seam: keeps cached results from leaking between test cases. */
export function clearIconSearchCache(): void {
  SEARCH_CACHE.clear()
}

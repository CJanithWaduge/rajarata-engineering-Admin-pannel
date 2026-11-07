/** Longest accepted embed URL. Google's `pb` URLs are normally well under 1 KB. */
export const MAP_EMBED_MAX_LENGTH = 2048

/**
 * Hosts Google's "Embed a map" dialog uses. Restricting the host and path is
 * what keeps this field from becoming an arbitrary iframe URL: the admin can
 * only store a Google Maps embed, never another origin's frame.
 */
const MAP_EMBED_HOSTS = new Set(['www.google.com', 'google.com', 'maps.google.com'])

/**
 * Accepts either the full `<iframe ...>` snippet copied from Google Maps or a
 * bare URL. The copied snippet HTML-escapes its query separators as `&amp;`,
 * so those are decoded before the URL is validated.
 */
export function extractGoogleMapEmbedUrl(input: string): string {
  const trimmed = input.trim()
  if (trimmed === '') return ''

  const iframe = trimmed.match(
    /<iframe\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i,
  )
  const candidate = (iframe?.[1] ?? iframe?.[2] ?? iframe?.[3] ?? trimmed).trim()

  return candidate.replace(/&amp;/gi, '&')
}

/** True only for an `https://www.google.com/maps/embed?pb=...` URL. */
export function isGoogleMapEmbedUrl(value: string): boolean {
  if (value === '' || value.length > MAP_EMBED_MAX_LENGTH) return false

  try {
    const url = new URL(value)
    const path = url.pathname.replace(/\/+$/, '')

    return (
      url.protocol === 'https:' &&
      MAP_EMBED_HOSTS.has(url.hostname.toLowerCase()) &&
      path === '/maps/embed' &&
      url.searchParams.has('pb')
    )
  } catch {
    return false
  }
}

interface BrandLogoProps {
  /** `light` for light surfaces, `dark` for near-black/inverted surfaces. */
  variant?: 'light' | 'dark'
  className?: string
}

/**
 * Brand mark mirrored from the public site's `Logo.astro`
 * (UI-UX-design/rajarata_engineering_logo). Keep geometry in sync.
 *
 * Two deliberate differences from the public site copy:
 * - The viewBox is `0 0 148 50` (design source says 240). The artwork stops
 *   at x≈146, so the original 240-wide box carried ~94 units of dead space on
 *   the right; `mx-auto` centred the *box* and the visible logo sat ~37px left
 *   of centre. 148 hugs the artwork (2 left / 2 right margin) and the scale
 *   stays height-driven, so the rendered size is unchanged.
 * - The wordmark baselines are 1.5 units higher than the design's 27/40. Cap
 *   heights put the two-line block's optical centre at y≈26.5 while the tile
 *   centres on y=25; the shift makes them agree. The public site is
 *   left-aligned, where neither difference is visible — if the source of truth
 *   changes, change both repos deliberately.
 */
export function BrandLogo({
  variant = 'light',
  className = '',
}: BrandLogoProps) {
  const isDark = variant === 'dark'
  // On dark surfaces the tile inverts to brand red so the bolt (white) reads;
  // the light variant keeps the near-black tile used on the public site.
  const tileFill = isDark ? '#D32F2F' : '#111827'
  const boltFill = isDark ? '#FFFFFF' : '#D32F2F'
  const dotFill = isDark ? '#FFD180' : '#FF6D00'
  const textFill = isDark ? '#FFFFFF' : '#111827'
  const accentFill = isDark ? '#FFB3AC' : '#D32F2F'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 148 50"
      fill="none"
      overflow="visible"
      role="img"
      aria-label="Rajarata Engineering"
      className={className}
    >
      <rect x="2" y="5" width="40" height="40" rx="8" fill={tileFill} />
      <path d="M22 10L14 26H22L20 40L30 23H22L26 10H22Z" fill={boltFill} />
      <circle cx="32" cy="14" r="2" fill={dotFill} />
      <text
        x="52"
        y="25.5"
        fill={textFill}
        fontFamily='"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif'
        fontWeight="800"
        fontSize="19"
        letterSpacing="-0.5px"
      >
        RAJARATA
      </text>
      <text
        x="52"
        y="38.5"
        fill={accentFill}
        fontFamily='"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif'
        fontWeight="700"
        fontSize="10.5"
        letterSpacing="2px"
      >
        ENGINEERING
      </text>
    </svg>
  )
}

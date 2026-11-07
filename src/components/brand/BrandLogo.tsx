interface BrandLogoProps {
  /** `light` for light surfaces, `dark` for near-black/inverted surfaces. */
  variant?: 'light' | 'dark'
  className?: string
}

export function BrandLogo({
  variant = 'light',
  className = '',
}: BrandLogoProps) {
  const isDark = variant === 'dark'
  const markFill = isDark ? '#FFFFFF' : '#111827'
  const boltFill = isDark ? '#FFFFFF' : '#D32F2F'
  const dotFill = isDark ? '#FFFFFF' : '#FF6D00'
  const accentFill = isDark ? '#FFFFFF' : '#D32F2F'

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 50"
      fill="none"
      role="img"
      aria-label="Rajarata Engineering"
      className={className}
    >
      <rect x="2" y="5" width="40" height="40" rx="8" fill={markFill} />
      <path d="M22 10L14 26H22L20 40L30 23H22L26 10H22Z" fill={boltFill} />
      <circle cx="32" cy="14" r="2" fill={dotFill} />
      <text
        x="52"
        y="27"
        fill={markFill}
        fontWeight="800"
        fontSize="19"
        letterSpacing="-0.5px"
      >
        RAJARATA
      </text>
      <text
        x="52"
        y="40"
        fill={accentFill}
        fontWeight="700"
        fontSize="10.5"
        letterSpacing="2px"
      >
        ENGINEERING
      </text>
    </svg>
  )
}

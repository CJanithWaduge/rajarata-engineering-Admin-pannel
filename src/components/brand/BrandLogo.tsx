interface BrandLogoProps {
  className?: string
}

export function BrandLogo({ className = '' }: BrandLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src="admin-logo.jpeg" alt="" className="h-8 w-8 object-contain" />
      <span className="font-semibold">
        Rajarata
        <br />
        <span className="text-[11px] text-primary-container">Engineering</span>
      </span>
    </div>
  )
}
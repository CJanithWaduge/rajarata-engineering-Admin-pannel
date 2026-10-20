import type { ReactNode } from 'react'

type AlertVariant = 'error' | 'info' | 'success'

interface AlertProps {
  variant?: AlertVariant
  children: ReactNode
  className?: string
}

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  error: 'border-primary-container/30 bg-error-container text-on-error-container',
  info: 'border-tertiary-fixed bg-tertiary-fixed/60 text-on-tertiary-fixed',
  success:
    'border-secondary-container bg-secondary-container text-on-secondary-container',
}

export function Alert({
  variant = 'error',
  children,
  className = '',
}: AlertProps) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={[
        'rounded-control border px-4 py-3 font-body-sm text-body-sm',
        VARIANT_CLASSES[variant],
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

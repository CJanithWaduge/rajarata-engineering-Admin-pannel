import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-container text-on-primary shadow-sm hover:bg-primary hover:shadow-md',
  secondary:
    'bg-surface-container text-on-surface hover:bg-surface-container-high',
  outline:
    'border-[1.5px] border-outline-variant bg-transparent text-on-surface hover:bg-surface-container-low hover:border-outline',
  ghost: 'text-primary hover:bg-primary-fixed/40',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-10 px-5',
  md: 'h-12 px-7',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={[
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-label-md text-label-md transition-all duration-150 active:translate-y-px focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container disabled:pointer-events-none disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
    >
      {isLoading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  )
}

import { useId } from 'react'
import type { ComponentPropsWithRef, ReactNode } from 'react'

export type FieldTone = 'light' | 'dark'

export interface TextFieldProps extends ComponentPropsWithRef<'input'> {
  label: string
  error?: string
  hint?: string
  endAdornment?: ReactNode
  /** `light` on white surfaces (default), `dark` on the login hero card. */
  tone?: FieldTone
}

const TONE_CLASSES: Record<
  FieldTone,
  { label: string; input: string; error: string; hint: string }
> = {
  light: {
    label: 'text-on-surface',
    input:
      'border-outline-variant bg-surface-container-lowest text-on-surface placeholder:text-secondary/60 focus:bg-surface-container-low focus:ring-on-surface focus:ring-offset-2',
    error: 'text-primary-container',
    hint: 'text-secondary',
  },
  dark: {
    label: 'text-auth-on-surface-muted',
    input:
      'border-auth-outline bg-auth-surface/70 text-auth-on-surface placeholder:text-auth-on-surface-muted/50 [color-scheme:dark] focus:border-primary-container focus:bg-auth-surface focus:ring-primary-container focus:ring-offset-0',
    error: 'text-primary-fixed-dim',
    hint: 'text-auth-on-surface-muted',
  },
}

export function TextField({
  label,
  error,
  hint,
  endAdornment,
  tone = 'light',
  id,
  className = '',
  ...rest
}: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const toneClasses = TONE_CLASSES[tone]
  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div className="flex flex-col space-y-1.5">
      <label
        htmlFor={inputId}
        className={[
          'font-label-sm text-label-sm font-semibold',
          toneClasses.label,
        ].join(' ')}
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={[
            'h-12 w-full rounded-control border-[1.5px] px-4 font-body-md text-body-md shadow-sm transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
            toneClasses.input,
            error
              ? tone === 'dark'
                ? 'border-primary-fixed-dim focus:ring-primary-fixed-dim'
                : 'border-primary-container focus:ring-primary-container'
              : '',
            endAdornment ? 'pr-16' : '',
            className,
          ].join(' ')}
          {...rest}
        />
        {endAdornment ? (
          <div className="absolute inset-y-0 right-1.5 flex items-center">
            {endAdornment}
          </div>
        ) : null}
      </div>

      {error ? (
        <p
          id={errorId}
          className={['font-body-sm text-body-sm', toneClasses.error].join(' ')}
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={hintId}
          className={['font-body-sm text-body-sm', toneClasses.hint].join(' ')}
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}

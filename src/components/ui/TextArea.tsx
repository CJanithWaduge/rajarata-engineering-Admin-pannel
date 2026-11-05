import { useId } from 'react'
import type { ComponentPropsWithRef } from 'react'

export interface TextAreaProps extends ComponentPropsWithRef<'textarea'> {
  label: string
  error?: string
  hint?: string
}

export function TextArea({
  label,
  error,
  hint,
  id,
  className = '',
  rows = 4,
  ...rest
}: TextAreaProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <div className="flex flex-col space-y-1.5">
      <label
        htmlFor={inputId}
        className="font-label-sm text-label-sm font-semibold text-on-surface"
      >
        {label}
      </label>

      <textarea
        id={inputId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          'min-h-24 w-full resize-y rounded-control border-[1.5px] border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface shadow-sm transition-colors placeholder:text-secondary/60 focus:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-on-surface focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
          error ? 'border-primary-container focus:ring-primary-container' : '',
          className,
        ].join(' ')}
        {...rest}
      />

      {error ? (
        <p
          id={errorId}
          className="font-body-sm text-body-sm text-primary-container"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="font-body-sm text-body-sm text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

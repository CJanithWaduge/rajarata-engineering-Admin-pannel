import { useId } from 'react'
import type { ComponentPropsWithRef } from 'react'

export type SelectOption = {
  value: string
  label: string
}

export interface SelectFieldProps extends ComponentPropsWithRef<'select'> {
  label: string
  options: readonly SelectOption[]
  error?: string
  hint?: string
}

export function SelectField({
  label,
  options,
  error,
  hint,
  id,
  className = '',
  ...rest
}: SelectFieldProps) {
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

      <select
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          'h-12 w-full rounded-control border-[1.5px] border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md text-on-surface shadow-sm transition-colors focus:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-on-surface focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
          error ? 'border-primary-container focus:ring-primary-container' : '',
          className,
        ].join(' ')}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

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

import { useEffect, useRef } from 'react'

type ToastProps = {
  message: string
  onDismiss: () => void
  /** Milliseconds before the toast dismisses itself. */
  duration?: number
}

/**
 * Transient confirmation box. Sits above the page chrome, announces itself to
 * assistive technology, and disappears on its own so it never becomes stale
 * inline content.
 */
export function Toast({ message, onDismiss, duration = 4000 }: ToastProps) {
  const dismissRef = useRef(onDismiss)

  useEffect(() => {
    dismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    const timer = window.setTimeout(() => dismissRef.current(), duration)
    return () => window.clearTimeout(timer)
  }, [duration, message])

  return (
    <div
      role="status"
      className="motion-safe:animate-[toast-in_180ms_ease-out] fixed bottom-4 left-4 right-4 z-[60] overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest shadow-overlay sm:bottom-6 sm:left-auto sm:right-6 sm:w-80"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px] bg-primary-container"
      />
      <div className="flex items-start gap-3 py-3.5 pl-5 pr-3">
        <span
          aria-hidden="true"
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>

        <p className="min-w-0 flex-1 font-label-md text-label-md text-on-surface">
          {message}
        </p>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-container"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

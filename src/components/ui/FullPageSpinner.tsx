export function FullPageSpinner() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
      aria-live="polite"
    >
      <span
        className="h-10 w-10 animate-spin rounded-full border-4 border-outline-variant border-t-primary-container"
        aria-hidden="true"
      />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

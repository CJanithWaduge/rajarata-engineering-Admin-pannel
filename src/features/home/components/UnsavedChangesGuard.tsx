import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

export function UnsavedChangesGuard({ when }: { when: boolean }) {
  const blocker = useBlocker(when)

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (when) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [when])

  if (blocker.state === 'blocked') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center bg-surface/60 px-4"
      >
        <div className="w-full max-w-md rounded-card border border-outline-variant bg-surface p-6 shadow-card">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Unsaved changes</h2>
          <p className="mt-2 font-body-md text-body-md text-secondary">
            You have unsaved changes. Are you sure you want to leave?
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => blocker.reset()}
              className="rounded-control border border-outline-variant px-3 py-1.5 font-label-md text-label-md text-on-surface hover:bg-surface-container-high"
            >
              Stay on page
            </button>
            <button
              type="button"
              onClick={() => blocker.proceed()}
              className="rounded-control bg-primary px-3 py-1.5 font-label-md text-label-md text-on-primary hover:bg-primary/90"
            >
              Leave without saving
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

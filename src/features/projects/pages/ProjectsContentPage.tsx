import { useState } from 'react'
import { Alert } from '../../../components/ui/Alert'
import { FullPageSpinner } from '../../../components/ui/FullPageSpinner'
import { Toast } from '../../../components/ui/Toast'
import { useAuth } from '../../auth/useAuth'
import { ProjectsContentForm } from '../components/ProjectsContentForm'
import type { ProjectsFormValues } from '../types'
import { useProjectsContent } from '../useProjectsContent'

export function ProjectsContentPage() {
  const { admin } = useAuth()
  const { status, content, exists, error, version, reload, save } = useProjectsContent()
  const [success, setSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (status === 'loading') {
    return <FullPageSpinner />
  }

  const handleSave = async (values: ProjectsFormValues) => {
    if (!admin) return
    setSuccess(null)
    setSaveError(null)
    const result = await save(values, admin.uid)
    if (result) {
      setSaveError(result.message)
    } else {
      setSuccess('Successfully saved changes')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline-md text-headline-md text-on-surface">
          Projects Page Settings
        </h1>
        <p className="mt-2 font-body-md text-body-md text-secondary">
          Hero, project cards, track record, and CTA on the public Projects page.
          Changes go live immediately after saving.
        </p>
      </header>

      {status === 'error' && error ? (
        <Alert variant="error">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void reload()}
              className="rounded-control border border-outline-variant px-3 py-1.5 font-label-md text-label-md text-on-surface hover:bg-surface-container-high"
            >
              Retry
            </button>
          </div>
        </Alert>
      ) : (
        <>
          {!exists ? (
            <Alert variant="info">
              No projects page content exists yet. The public site is currently showing
              its built-in Projects content. Complete every field and save to publish;
              nothing is written until you save, and no placeholder values are created
              automatically.
            </Alert>
          ) : null}

          <ProjectsContentForm
            key={version}
            initial={content}
            onSubmit={(values) => void handleSave(values)}
            isSaving={status === 'saving'}
            errorMessage={status === 'ready' && error ? error : null}
          />
        </>
      )}

      {success ? <Toast message={success} onDismiss={() => setSuccess(null)} /> : null}
      {saveError ? (
        <Toast
          variant="error"
          message={saveError}
          duration={8000}
          onDismiss={() => setSaveError(null)}
        />
      ) : null}
    </div>
  )
}

import { useState } from 'react'
import { Alert } from '../../../components/ui/Alert'
import { FullPageSpinner } from '../../../components/ui/FullPageSpinner'
import { Toast } from '../../../components/ui/Toast'
import { useAuth } from '../../auth/useAuth'
import { HomeContentForm } from '../components/HomeContentForm'
import type { HomeDraft } from '../types'
import { useHomeContent } from '../useHomeContent'

export function HomeContentPage() {
  const { admin } = useAuth()
  const { status, content, exists, error, version, reload, save } = useHomeContent()
  const [success, setSuccess] = useState<string | null>(null)

  if (status === 'loading') {
    return <FullPageSpinner />
  }

  const handleSave = async (draft: HomeDraft) => {
    if (!admin) return
    setSuccess(null)
    const result = await save(draft, admin.uid)
    if (!result) {
      setSuccess('Successfully saved changes')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline-md text-headline-md text-on-surface">
          Home Page Settings
        </h1>
        <p className="mt-2 font-body-md text-body-md text-secondary">
          The hero image and the three Featured Engineering Projects cards on the public
          Home page. Changes go live immediately after saving.
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
              No home page content exists yet. The public site is currently showing its
              built-in Home content. Choose a hero image, fill in all three cards, and save
              to create the{' '}
              <code className="rounded-chip bg-surface-container px-1.5 py-0.5 font-mono text-[0.85em]">
                site/home
              </code>{' '}
              document. Nothing is written until you save, and no placeholder values are
              created automatically.
            </Alert>
          ) : null}

          <HomeContentForm
            key={version}
            initial={content}
            onSubmit={(draft) => void handleSave(draft)}
            isSaving={status === 'saving'}
            errorMessage={status === 'ready' && error ? error : null}
          />
        </>
      )}

      {success ? <Toast message={success} onDismiss={() => setSuccess(null)} /> : null}
    </div>
  )
}

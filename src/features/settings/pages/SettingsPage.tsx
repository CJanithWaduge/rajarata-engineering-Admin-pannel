import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../auth/useAuth'
import { FullPageSpinner } from '../../../components/ui/FullPageSpinner'
import { Alert } from '../../../components/ui/Alert'
import { Toast } from '../../../components/ui/Toast'
import { useSettings } from '../useSettings'
import { SettingsForm } from '../components/SettingsForm'
import { SettingsEmptyState } from '../components/SettingsEmptyState'
import { UnsavedChangesGuard } from '../components/UnsavedChangesGuard'
import { SeedButton } from '../components/SeedButton'
import { EMPTY_FORM_VALUES } from '../defaults'
import type { SettingsDraft, SettingsFormValues } from '../types'

export function SettingsPage() {
  const { admin } = useAuth()
  const { status, settings, exists, error, reload, save } = useSettings()
  const [success, setSuccess] = useState<string | null>(null)
  const form = useForm<SettingsFormValues>({ defaultValues: EMPTY_FORM_VALUES })

  const defaultValues: SettingsFormValues = {
    phone: settings.phone,
    whatsapp: settings.whatsapp,
    email: settings.email,
    address: settings.address,
    facebookUrl: settings.facebookUrl,
    facebookLabel: settings.facebookLabel,
    location: settings.location,
    mapEmbedUrl: settings.mapEmbedUrl,
    logoAlt: settings.logoAlt,
  }

  if (status === 'loading') {
    return <FullPageSpinner />
  }

  const handleSave = async (draft: SettingsDraft) => {
    setSuccess(null)
    const result = await save(draft, admin?.uid ?? '', settings)
    if (!result) {
      setSuccess('Successfully saved changes')
    }
  }

  const dirty = form.formState.isDirty

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline-md text-headline-md text-on-surface">Site Settings</h1>
        <p className="mt-2 font-body-md text-body-md text-secondary">
          Contact details, links, and logo shown on every page of the public website.
          Changes go live immediately.
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
      ) : null}

      {status === 'ready' || status === 'saving' ? (
        <>
          {!exists ? <SettingsEmptyState /> : null}

          <SettingsForm
            defaultValues={defaultValues}
            initialLogo={
              settings.logoUrl
                ? {
                    kind: 'stored',
                    image: {
                      url: settings.logoUrl,
                      path: settings.logoPath,
                      alt: settings.logoAlt,
                      width: settings.logoWidth,
                      height: settings.logoHeight,
                      size: settings.logoSize,
                      contentType: settings.logoContentType,
                    },
                  }
                : { kind: 'none' }
            }
            onSubmit={handleSave}
            isSaving={status === 'saving'}
            errorMessage={status === 'ready' && error ? error : null}
          />

          <SeedButton />

          <UnsavedChangesGuard when={dirty && status === 'ready'} />
        </>
      ) : null}

      {success ? <Toast message={success} onDismiss={() => setSuccess(null)} /> : null}
    </div>
  )
}

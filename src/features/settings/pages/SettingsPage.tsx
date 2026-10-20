import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../auth/useAuth'
import { FullPageSpinner } from '../../../components/ui/FullPageSpinner'
import { Alert } from '../../../components/ui/Alert'
import { useSettings } from '../useSettings'
import { SettingsForm } from '../components/SettingsForm'
import { SettingsEmptyState } from '../components/SettingsEmptyState'
import { UnsavedChangesGuard } from '../components/UnsavedChangesGuard'
import { EMPTY_FORM_VALUES } from '../defaults'
import type { SettingsFormValues } from '../types'

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
    location: settings.location,
  }

  if (status === 'loading') {
    return <FullPageSpinner />
  }

  const handleSave = async (values: SettingsFormValues) => {
    setSuccess(null)
    const result = await save(values, admin?.uid ?? '')
    if (!result) {
      setSuccess('Settings saved.')
    }
  }

  const dirty = form.formState.isDirty

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-headline-md text-headline-md text-on-surface">Site Settings</h1>
        <p className="mt-2 font-body-md text-body-md text-secondary">
          Contact details and links shown on every page of the public website. Changes go live
          immediately.
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

      {!exists ? <SettingsEmptyState /> : null}

      <SettingsForm
        defaultValues={defaultValues}
        onSubmit={handleSave}
        isSaving={status === 'saving'}
        successMessage={success}
        errorMessage={status === 'ready' && error ? error : null}
      />

      <UnsavedChangesGuard when={dirty && status === 'ready'} />
    </div>
  )
}

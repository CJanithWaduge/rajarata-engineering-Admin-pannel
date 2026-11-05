import { useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { CollapsibleSection } from '../../../components/ui/CollapsibleSection'
import { UnsavedChangesGuard } from '../../../components/ui/UnsavedChangesGuard'
import { SERVICE_COUNT } from '../constants'
import { valuesFromContent } from '../defaults'
import { servicesFormSchema } from '../schema'
import type { ServicesContent, ServicesFormValues } from '../types'
import { ServiceCardEditor } from './ServiceCardEditor'
import { ProcessEditor } from './ProcessEditor'
import { ServicesCtaEditor } from './ServicesCtaEditor'
import { ServicesDirectoryEditor } from './ServicesDirectoryEditor'
import { ServicesHeroEditor } from './ServicesHeroEditor'

type SectionKey = 'hero' | 'directory' | 'services' | 'process' | 'cta'

type Props = {
  initial: ServicesContent | null
  isSaving: boolean
  errorMessage: string | null
  onSubmit: (values: ServicesFormValues) => void
}

export function ServicesContentForm({
  initial,
  isSaving,
  errorMessage,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ServicesFormValues>({
    resolver: zodResolver(servicesFormSchema),
    defaultValues: valuesFromContent(initial),
    shouldFocusError: true,
  })

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    hero: true,
    directory: false,
    services: false,
    process: false,
    cta: false,
  })

  const toggle = (key: SectionKey) => {
    setOpen((current) => ({ ...current, [key]: !current[key] }))
  }

  const handleInvalid = (formErrors: FieldErrors<ServicesFormValues>) => {
    setOpen((current) => ({
      ...current,
      hero: current.hero || Boolean(formErrors.hero),
      directory: current.directory || Boolean(formErrors.directory),
      services: current.services || Boolean(formErrors.services),
      process: current.process || Boolean(formErrors.process),
      cta: current.cta || Boolean(formErrors.cta),
    }))

    window.setTimeout(() => {
      const firstInvalid = document.querySelector<HTMLElement>('[aria-invalid="true"]')
      firstInvalid?.focus()
    }, 0)
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={handleSubmit(onSubmit, handleInvalid)}
      noValidate
    >
      {errorMessage ? <Alert variant="error">{errorMessage}</Alert> : null}

      <Alert variant="info">
        All text fields are required except the optional mobile process descriptions.
        The document is saved as one unit, so every section must be complete before
        the save is accepted.
      </Alert>

      <CollapsibleSection
        title="Hero"
        description="Eyebrow, headline, intro, four quick links, and four metrics."
        open={open.hero}
        onToggle={() => toggle('hero')}
        contentClassName="px-6 py-5"
      >
        <ServicesHeroEditor
          register={register}
          errors={errors}
          disabled={isSaving}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Directory"
        description="The heading and intro above the eight service cards."
        open={open.directory}
        onToggle={() => toggle('directory')}
        contentClassName="px-6 py-5"
      >
        <ServicesDirectoryEditor
          register={register}
          errors={errors}
          disabled={isSaving}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Service Cards"
        description="Eight fixed service cards. Numbers and anchors are derived from their position."
        open={open.services}
        onToggle={() => toggle('services')}
        contentClassName="grid gap-5 px-6 py-5"
      >
        {Array.from({ length: SERVICE_COUNT }, (_, index) => (
          <ServiceCardEditor
            key={index}
            index={index}
            register={register}
            errors={errors.services}
            disabled={isSaving}
          />
        ))}
      </CollapsibleSection>

      <CollapsibleSection
        title="Engineering Process"
        description="The process heading and six fixed steps."
        open={open.process}
        onToggle={() => toggle('process')}
        contentClassName="px-6 py-5"
      >
        <ProcessEditor register={register} errors={errors} disabled={isSaving} />
      </CollapsibleSection>

      <CollapsibleSection
        title="CTA"
        description="The closing panel copy and its two trust points. Contact buttons stay in Site Settings."
        open={open.cta}
        onToggle={() => toggle('cta')}
        contentClassName="px-6 py-5"
      >
        <ServicesCtaEditor register={register} errors={errors} disabled={isSaving} />
      </CollapsibleSection>

      <div className="flex flex-col gap-3 border-t border-outline-variant pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body-sm text-body-sm text-secondary">
          One Save writes the whole document. Changes go live immediately.
        </p>
        <Button type="submit" isLoading={isSaving} disabled={!isDirty || isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>

      <UnsavedChangesGuard when={isDirty && !isSaving} />
    </form>
  )
}

import { useState } from 'react'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { CollapsibleSection } from '../../../components/ui/CollapsibleSection'
import { UnsavedChangesGuard } from '../../../components/ui/UnsavedChangesGuard'
import { PROJECT_COUNT } from '../constants'
import { valuesFromContent } from '../defaults'
import { projectsFormSchema } from '../schema'
import type { ProjectsContent, ProjectsFormValues } from '../types'
import { ProjectCardEditor } from './ProjectCardEditor'
import { ProjectsCtaEditor } from './ProjectsCtaEditor'
import { ProjectsHeroEditor } from './ProjectsHeroEditor'
import { ProjectsTrackRecordEditor } from './ProjectsTrackRecordEditor'

type SectionKey = 'hero' | 'portfolio' | 'trackRecord' | 'cta'

type Props = {
  initial: ProjectsContent | null
  isSaving: boolean
  errorMessage: string | null
  onSubmit: (values: ProjectsFormValues) => void
}

export function ProjectsContentForm({
  initial,
  isSaving,
  errorMessage,
  onSubmit,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProjectsFormValues>({
    resolver: zodResolver(projectsFormSchema),
    defaultValues: valuesFromContent(initial),
    shouldFocusError: true,
  })

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    hero: true,
    portfolio: false,
    trackRecord: false,
    cta: false,
  })

  const toggle = (key: SectionKey) => {
    setOpen((current) => ({ ...current, [key]: !current[key] }))
  }

  const handleInvalid = (formErrors: FieldErrors<ProjectsFormValues>) => {
    setOpen((current) => ({
      ...current,
      hero: current.hero || Boolean(formErrors.hero),
      portfolio: current.portfolio || Boolean(formErrors.portfolio),
      trackRecord: current.trackRecord || Boolean(formErrors.trackRecord),
      cta: current.cta || Boolean(formErrors.cta),
    }))

    window.setTimeout(() => {
      const firstInvalid = document.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      )
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
        Every text field is optional; leave one blank to keep the public page’s
        build-time copy for that slot. The document is saved as one unit, so fixed
        array counts and the category allowlist must still be valid.
      </Alert>

      <CollapsibleSection
        title="Hero"
        description="Eyebrow, headline, and intro shown at the top of the public Projects page."
        open={open.hero}
        onToggle={() => toggle('hero')}
        contentClassName="px-6 py-5"
      >
        <ProjectsHeroEditor register={register} errors={errors} disabled={isSaving} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Project Cards"
        description={`${PROJECT_COUNT} fixed project cards. Blank text keeps the public page copy; the category must be one of the allowed values.`}
        open={open.portfolio}
        onToggle={() => toggle('portfolio')}
        contentClassName="grid gap-5 px-6 py-5"
      >
        {Array.from({ length: PROJECT_COUNT }, (_, index) => (
          <ProjectCardEditor
            key={index}
            index={index}
            register={register}
            errors={errors.portfolio}
            disabled={isSaving}
          />
        ))}
      </CollapsibleSection>

      <CollapsibleSection
        title="Track Record"
        description="The three fixed capability columns that sit under the portfolio."
        open={open.trackRecord}
        onToggle={() => toggle('trackRecord')}
        contentClassName="px-6 py-5"
      >
        <ProjectsTrackRecordEditor register={register} errors={errors} disabled={isSaving} />
      </CollapsibleSection>

      <CollapsibleSection
        title="CTA"
        description="The closing panel copy. Contact buttons stay in Site Settings."
        open={open.cta}
        onToggle={() => toggle('cta')}
        contentClassName="px-6 py-5"
      >
        <ProjectsCtaEditor register={register} errors={errors} disabled={isSaving} />
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

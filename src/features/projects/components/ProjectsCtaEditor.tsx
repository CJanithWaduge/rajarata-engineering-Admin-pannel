import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import { ROUTES } from '../../../routes/paths'
import type { ProjectsFormValues } from '../types'

type Props = {
  register: UseFormRegister<ProjectsFormValues>
  errors: FieldErrors<ProjectsFormValues>
  disabled: boolean
}

/** Closing consultation panel copy. Contact buttons stay in Site Settings. */
export function ProjectsCtaEditor({ register, errors, disabled }: Props) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="projects-cta-eyebrow"
          label="Eyebrow"
          hint="0–48 characters. Leave blank to keep the public copy."
          disabled={disabled}
          error={errors.cta?.eyebrow?.message}
          {...register('cta.eyebrow')}
        />
        <TextField
          id="projects-cta-title"
          label="Title"
          hint="0–100 characters. Leave blank to keep the public copy."
          disabled={disabled}
          error={errors.cta?.title?.message}
          {...register('cta.title')}
        />
        <div className="sm:col-span-2">
          <TextArea
            id="projects-cta-body"
            label="Body"
            rows={4}
            hint="0–600 characters. Leave blank to keep the public copy."
            disabled={disabled}
            error={errors.cta?.body?.message}
            {...register('cta.body')}
          />
        </div>
      </div>

      <div className="rounded-control border border-outline-variant bg-surface-container-low px-4 py-3 font-body-sm text-body-sm text-secondary">
        WhatsApp and phone buttons come from{' '}
        <Link
          to={ROUTES.settings}
          className="font-label-sm text-label-sm text-primary underline-offset-4 hover:underline"
        >
          Site Settings
        </Link>
        . They are not editable here.
      </div>
    </div>
  )
}

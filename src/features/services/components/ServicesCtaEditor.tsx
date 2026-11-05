import { Link } from 'react-router-dom'
import type { FieldErrors, FieldPath, UseFormRegister } from 'react-hook-form'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import { CTA_POINT_COUNT } from '../constants'
import { ROUTES } from '../../../routes/paths'
import type { ServicesFormValues } from '../types'

type Props = {
  register: UseFormRegister<ServicesFormValues>
  errors: FieldErrors<ServicesFormValues>
  disabled: boolean
}

export function ServicesCtaEditor({ register, errors, disabled }: Props) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="services-cta-eyebrow"
          label="Eyebrow"
          hint="1–48 characters."
          disabled={disabled}
          error={errors.cta?.eyebrow?.message}
          {...register('cta.eyebrow')}
        />
        <TextField
          id="services-cta-title"
          label="Title"
          hint="1–100 characters."
          disabled={disabled}
          error={errors.cta?.title?.message}
          {...register('cta.title')}
        />
        <div className="sm:col-span-2">
          <TextArea
            id="services-cta-body"
            label="Body"
            rows={4}
            hint="1–600 characters."
            disabled={disabled}
            error={errors.cta?.body?.message}
            {...register('cta.body')}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: CTA_POINT_COUNT }, (_, index) => (
          <TextField
            key={index}
            id={`services-cta-point-${index}`}
            label={`CTA point ${index + 1}`}
            hint="1–80 characters."
            disabled={disabled}
            error={errors.cta?.points?.[index]?.message}
            {...register(
              `cta.points.${index}` as FieldPath<ServicesFormValues>,
            )}
          />
        ))}
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

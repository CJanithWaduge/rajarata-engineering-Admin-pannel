import { Link } from 'react-router-dom'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import { ROUTES } from '../../../routes/paths'
import { ABOUT_TEXT_LIMITS, aboutTextHint } from '../constants'
import type { AboutFormValues } from '../types'

type Props = {
  register: UseFormRegister<AboutFormValues>
  errors: FieldErrors<AboutFormValues>
  disabled: boolean
}

export function AboutCtaEditor({ register, errors, disabled }: Props) {
  const ctaErrors = errors.cta

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="about-cta-eyebrow"
          label="Eyebrow"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.ctaEyebrow)}
          disabled={disabled}
          error={ctaErrors?.eyebrow?.message}
          {...register('cta.eyebrow')}
        />
        <TextField
          id="about-cta-title"
          label="Title"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.ctaTitle)}
          disabled={disabled}
          error={ctaErrors?.title?.message}
          {...register('cta.title')}
        />
        <div className="sm:col-span-2">
          <TextArea
            id="about-cta-body"
            label="Body"
            rows={4}
            hint={aboutTextHint(ABOUT_TEXT_LIMITS.ctaBody)}
            disabled={disabled}
            error={ctaErrors?.body?.message}
            {...register('cta.body')}
          />
        </div>
      </div>

      <p className="font-body-sm text-body-sm text-secondary">
        The phone and WhatsApp buttons below this panel read from{' '}
        <Link
          to={ROUTES.settings}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Site Settings
        </Link>
        . They are not edited here.
      </p>
    </div>
  )
}

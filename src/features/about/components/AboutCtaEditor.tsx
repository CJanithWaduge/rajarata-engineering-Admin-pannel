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
        <TextField
          id="about-cta-projects-label"
          label="Projects button label"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.ctaProjectsLabel)}
          disabled={disabled}
          error={ctaErrors?.projectsLabel?.message}
          {...register('cta.projectsLabel')}
        />
        <TextField
          id="about-cta-phone-label"
          label="Phone label"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.ctaPhoneLabel)}
          disabled={disabled}
          error={ctaErrors?.phoneLabel?.message}
          {...register('cta.phoneLabel')}
        />
        <TextField
          id="about-cta-whatsapp-label"
          label="WhatsApp label"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.ctaWhatsappLabel)}
          disabled={disabled}
          error={ctaErrors?.whatsappLabel?.message}
          {...register('cta.whatsappLabel')}
        />
      </div>

      <p className="font-body-sm text-body-sm text-secondary">
        The phone and WhatsApp numbers themselves read from{' '}
        <Link
          to={ROUTES.settings}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Site Settings
        </Link>
        . Only their labels are edited here.
      </p>
    </div>
  )
}

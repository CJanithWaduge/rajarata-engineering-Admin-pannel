import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import { QuickLinksEditor } from './QuickLinksEditor'
import { MetricsEditor } from './MetricsEditor'
import type { ServicesFormValues } from '../types'

type Props = {
  register: UseFormRegister<ServicesFormValues>
  errors: FieldErrors<ServicesFormValues>
  disabled: boolean
}

export function ServicesHeroEditor({ register, errors, disabled }: Props) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="services-hero-eyebrow"
          label="Eyebrow"
          hint="1–48 characters."
          disabled={disabled}
          error={errors.hero?.eyebrow?.message}
          {...register('hero.eyebrow')}
        />
        <TextField
          id="services-hero-title"
          label="Title"
          hint="1–100 characters."
          disabled={disabled}
          error={errors.hero?.title?.message}
          {...register('hero.title')}
        />
        <div className="sm:col-span-2">
          <TextArea
            id="services-hero-intro"
            label="Intro"
            rows={4}
            hint="1–600 characters."
            disabled={disabled}
            error={errors.hero?.intro?.message}
            {...register('hero.intro')}
          />
        </div>
      </div>

      <QuickLinksEditor
        register={register}
        errors={errors.hero}
        disabled={disabled}
      />
      <MetricsEditor register={register} errors={errors.hero} disabled={disabled} />
    </div>
  )
}

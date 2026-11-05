import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import type { ServicesFormValues } from '../types'

type Props = {
  register: UseFormRegister<ServicesFormValues>
  errors: FieldErrors<ServicesFormValues>
  disabled: boolean
}

export function ServicesDirectoryEditor({ register, errors, disabled }: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField
        id="services-directory-eyebrow"
        label="Eyebrow"
        hint="1–48 characters."
        disabled={disabled}
        error={errors.directory?.eyebrow?.message}
        {...register('directory.eyebrow')}
      />
      <TextField
        id="services-directory-title"
        label="Title"
        hint="1–100 characters."
        disabled={disabled}
        error={errors.directory?.title?.message}
        {...register('directory.title')}
      />
      <div className="sm:col-span-2">
        <TextArea
          id="services-directory-intro"
          label="Intro"
          rows={4}
          hint="1–600 characters."
          disabled={disabled}
          error={errors.directory?.intro?.message}
          {...register('directory.intro')}
        />
      </div>
    </div>
  )
}

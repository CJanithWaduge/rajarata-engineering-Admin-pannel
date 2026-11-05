import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import type { ProjectsFormValues } from '../types'

type Props = {
  register: UseFormRegister<ProjectsFormValues>
  errors: FieldErrors<ProjectsFormValues>
  disabled: boolean
}

/** Hero copy shown at the top of the public Projects page. */
export function ProjectsHeroEditor({ register, errors, disabled }: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField
        id="projects-hero-eyebrow"
        label="Eyebrow"
        hint="0–48 characters. Leave blank to keep the public copy."
        disabled={disabled}
        error={errors.hero?.eyebrow?.message}
        {...register('hero.eyebrow')}
      />
      <TextField
        id="projects-hero-title"
        label="Title"
        hint="0–100 characters. Leave blank to keep the public copy."
        disabled={disabled}
        error={errors.hero?.title?.message}
        {...register('hero.title')}
      />
      <div className="sm:col-span-2">
        <TextArea
          id="projects-hero-intro"
          label="Intro"
          rows={4}
          hint="0–600 characters. Leave blank to keep the public copy."
          disabled={disabled}
          error={errors.hero?.intro?.message}
          {...register('hero.intro')}
        />
      </div>
    </div>
  )
}

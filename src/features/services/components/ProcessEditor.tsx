import type { FieldErrors, FieldPath, UseFormRegister } from 'react-hook-form'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import { PROCESS_STEP_COUNT } from '../constants'
import type { ServicesFormValues } from '../types'

type Props = {
  register: UseFormRegister<ServicesFormValues>
  errors: FieldErrors<ServicesFormValues>
  disabled: boolean
}

export function ProcessEditor({ register, errors, disabled }: Props) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="services-process-eyebrow"
          label="Eyebrow"
          hint="1–48 characters."
          disabled={disabled}
          error={errors.process?.eyebrow?.message}
          {...register('process.eyebrow')}
        />
        <TextField
          id="services-process-title"
          label="Title"
          hint="1–100 characters."
          disabled={disabled}
          error={errors.process?.title?.message}
          {...register('process.title')}
        />
        <div className="sm:col-span-2">
          <TextArea
            id="services-process-intro"
            label="Intro"
            rows={4}
            hint="1–600 characters."
            disabled={disabled}
            error={errors.process?.intro?.message}
            {...register('process.intro')}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {Array.from({ length: PROCESS_STEP_COUNT }, (_, index) => (
          <fieldset
            key={index}
            className="rounded-control border border-outline-variant bg-surface-container-low/50 p-4"
          >
            <legend className="px-1 font-label-md text-label-md font-semibold text-on-surface">
              Step {index + 1}
            </legend>
            <div className="grid gap-4">
              <TextField
                id={`services-process-step-${index}-title`}
                label="Step title"
                hint="1–60 characters."
                disabled={disabled}
                error={errors.process?.steps?.[index]?.title?.message}
                {...register(
                  `process.steps.${index}.title` as FieldPath<ServicesFormValues>,
                )}
              />
              <TextArea
                id={`services-process-step-${index}-description`}
                label="Desktop description"
                rows={3}
                hint="1–300 characters."
                disabled={disabled}
                error={errors.process?.steps?.[index]?.description?.message}
                {...register(
                  `process.steps.${index}.description` as FieldPath<ServicesFormValues>,
                )}
              />
              <TextArea
                id={`services-process-step-${index}-mobile`}
                label="Mobile description (optional)"
                rows={3}
                hint="0–300 characters. Leave blank to reuse the desktop description."
                disabled={disabled}
                error={errors.process?.steps?.[index]?.mobileDescription?.message}
                {...register(
                  `process.steps.${index}.mobileDescription` as FieldPath<ServicesFormValues>,
                )}
              />
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  )
}

import type { FieldErrors, FieldPath, UseFormRegister } from 'react-hook-form'
import { TextField } from '../../../components/ui/TextField'
import { TRACK_RECORD_COUNT } from '../constants'
import type { ProjectsFormValues } from '../types'

type Props = {
  register: UseFormRegister<ProjectsFormValues>
  errors: FieldErrors<ProjectsFormValues>
  disabled: boolean
}

/** The three fixed track-record capability columns. */
export function ProjectsTrackRecordEditor({ register, errors, disabled }: Props) {
  const columns = Array.from({ length: TRACK_RECORD_COUNT }, (_, index) => index)

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {columns.map((index) => {
        const columnErrors = errors.trackRecord?.columns?.[index]

        return (
          <fieldset
            key={index}
            className="rounded-control border border-outline-variant bg-surface-container-low/50 p-4"
          >
            <legend className="px-1 font-label-md text-label-md font-semibold text-on-surface">
              Track-record column {index + 1}
            </legend>
            <div className="grid gap-4">
              <TextField
                id={`projects-track-${index}-kicker`}
                label="Kicker"
                hint="0–60 characters. Leave blank to keep the public copy."
                disabled={disabled}
                error={columnErrors?.kicker?.message}
                {...register(
                  `trackRecord.columns.${index}.kicker` as FieldPath<ProjectsFormValues>,
                )}
              />
              <TextField
                id={`projects-track-${index}-value`}
                label="Value"
                hint="0–20 characters. Leave blank to keep the public copy."
                disabled={disabled}
                error={columnErrors?.value?.message}
                {...register(
                  `trackRecord.columns.${index}.value` as FieldPath<ProjectsFormValues>,
                )}
              />
              <TextField
                id={`projects-track-${index}-description`}
                label="Description"
                disabled={disabled}
                error={columnErrors?.description?.message}
                {...register(
                  `trackRecord.columns.${index}.description` as FieldPath<ProjectsFormValues>,
                )}
              />
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}

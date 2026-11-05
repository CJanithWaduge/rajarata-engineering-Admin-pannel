import type { FieldErrors, FieldPath, UseFormRegister } from 'react-hook-form'
import { SelectField } from '../../../components/ui/SelectField'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import {
  ABOUT_ICON_OPTIONS,
  ABOUT_TEXT_LIMITS,
  SECTOR_COUNT,
  aboutTextHint,
} from '../constants'
import type { AboutFormValues } from '../types'

type Props = {
  register: UseFormRegister<AboutFormValues>
  errors: FieldErrors<AboutFormValues>
  disabled: boolean
}

/** Heading plus the six fixed sector cards. */
export function IndustriesEditor({ register, errors, disabled }: Props) {
  const industryErrors = errors.industries

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="about-industries-eyebrow"
          label="Eyebrow"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.industriesEyebrow)}
          disabled={disabled}
          error={industryErrors?.eyebrow?.message}
          {...register('industries.eyebrow')}
        />
        <TextField
          id="about-industries-title"
          label="Title"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.industriesTitle)}
          disabled={disabled}
          error={industryErrors?.title?.message}
          {...register('industries.title')}
        />
        <div className="sm:col-span-2">
          <TextArea
            id="about-industries-intro"
            label="Intro"
            rows={3}
            hint={aboutTextHint(ABOUT_TEXT_LIMITS.industriesIntro)}
            disabled={disabled}
            error={industryErrors?.intro?.message}
            {...register('industries.intro')}
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="font-label-md text-label-md font-semibold text-on-surface">
          Sectors
        </legend>
        <p className="font-body-sm text-body-sm text-secondary">
          Exactly {SECTOR_COUNT} sectors. Card order is fixed by position; blank
          fields keep the public page value.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: SECTOR_COUNT }, (_, index) => {
            const sectorErrors = industryErrors?.sectors?.[index]
            return (
              <div
                key={index}
                className="grid gap-4 rounded-card border border-outline-variant bg-surface-container-low/40 p-5"
              >
                <p className="font-label-sm text-label-sm font-semibold text-on-surface">
                  Sector {index + 1}
                </p>
                <SelectField
                  id={`about-sector-${index}-icon`}
                  label="Icon"
                  options={ABOUT_ICON_OPTIONS}
                  disabled={disabled}
                  error={sectorErrors?.icon?.message}
                  {...register(
                    `industries.sectors.${index}.icon` as FieldPath<AboutFormValues>,
                  )}
                />
                <TextField
                  id={`about-sector-${index}-title`}
                  label="Title"
                  hint={aboutTextHint(ABOUT_TEXT_LIMITS.sectorTitle)}
                  disabled={disabled}
                  error={sectorErrors?.title?.message}
                  {...register(
                    `industries.sectors.${index}.title` as FieldPath<AboutFormValues>,
                  )}
                />
                <TextArea
                  id={`about-sector-${index}-description`}
                  label="Description"
                  rows={3}
                  hint={aboutTextHint(ABOUT_TEXT_LIMITS.sectorDescription)}
                  disabled={disabled}
                  error={sectorErrors?.description?.message}
                  {...register(
                    `industries.sectors.${index}.description` as FieldPath<AboutFormValues>,
                  )}
                />
              </div>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}

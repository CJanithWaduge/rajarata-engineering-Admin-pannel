import type { FieldErrors, FieldPath, UseFormRegister } from 'react-hook-form'
import { SelectField } from '../../../components/ui/SelectField'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import {
  ABOUT_ICON_OPTIONS,
  ABOUT_TEXT_LIMITS,
  PILLAR_COUNT,
  aboutTextHint,
} from '../constants'
import type { AboutFormValues } from '../types'

type Props = {
  register: UseFormRegister<AboutFormValues>
  errors: FieldErrors<AboutFormValues>
  disabled: boolean
}

/** Heading plus the five fixed conduct pillars. */
export function CorePillarsEditor({ register, errors, disabled }: Props) {
  const pillarErrors = errors.pillars

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="about-pillars-eyebrow"
          label="Eyebrow"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.pillarsEyebrow)}
          disabled={disabled}
          error={pillarErrors?.eyebrow?.message}
          {...register('pillars.eyebrow')}
        />
        <TextField
          id="about-pillars-title"
          label="Title"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.pillarsTitle)}
          disabled={disabled}
          error={pillarErrors?.title?.message}
          {...register('pillars.title')}
        />
        <div className="sm:col-span-2">
          <TextArea
            id="about-pillars-intro"
            label="Intro"
            rows={3}
            hint={aboutTextHint(ABOUT_TEXT_LIMITS.pillarsIntro)}
            disabled={disabled}
            error={pillarErrors?.intro?.message}
            {...register('pillars.intro')}
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="font-label-md text-label-md font-semibold text-on-surface">
          Pillars
        </legend>
        <p className="font-body-sm text-body-sm text-secondary">
          Exactly {PILLAR_COUNT} cards. Icon colour and card order are fixed by
          position; blank fields keep the public page value.
        </p>

        <div className="grid gap-4">
          {Array.from({ length: PILLAR_COUNT }, (_, index) => {
            const itemErrors = pillarErrors?.items?.[index]
            return (
              <div
                key={index}
                className="grid gap-5 rounded-card border border-outline-variant bg-surface-container-low/40 p-5 sm:grid-cols-2"
              >
                <p className="font-label-sm text-label-sm font-semibold text-on-surface sm:col-span-2">
                  Pillar {index + 1}
                </p>
                <SelectField
                  id={`about-pillar-${index}-icon`}
                  label="Icon"
                  options={ABOUT_ICON_OPTIONS}
                  disabled={disabled}
                  error={itemErrors?.icon?.message}
                  {...register(
                    `pillars.items.${index}.icon` as FieldPath<AboutFormValues>,
                  )}
                />
                <TextField
                  id={`about-pillar-${index}-title`}
                  label="Title"
                  hint={aboutTextHint(ABOUT_TEXT_LIMITS.pillarTitle)}
                  disabled={disabled}
                  error={itemErrors?.title?.message}
                  {...register(
                    `pillars.items.${index}.title` as FieldPath<AboutFormValues>,
                  )}
                />
                <div className="sm:col-span-2">
                  <TextArea
                    id={`about-pillar-${index}-description`}
                    label="Description"
                    rows={3}
                    hint={aboutTextHint(ABOUT_TEXT_LIMITS.pillarDescription)}
                    disabled={disabled}
                    error={itemErrors?.description?.message}
                    {...register(
                      `pillars.items.${index}.description` as FieldPath<AboutFormValues>,
                    )}
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextField
                    id={`about-pillar-${index}-footer`}
                    label="Footer line"
                    hint={aboutTextHint(ABOUT_TEXT_LIMITS.pillarFooter)}
                    disabled={disabled}
                    error={itemErrors?.footer?.message}
                    {...register(
                      `pillars.items.${index}.footer` as FieldPath<AboutFormValues>,
                    )}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}

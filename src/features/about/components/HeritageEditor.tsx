import type { FieldErrors, FieldPath, UseFormRegister } from 'react-hook-form'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import {
  ABOUT_TEXT_LIMITS,
  MILESTONE_COUNT,
  aboutTextHint,
} from '../constants'
import type { AboutFormValues } from '../types'

type Props = {
  register: UseFormRegister<AboutFormValues>
  errors: FieldErrors<AboutFormValues>
  disabled: boolean
}

/** The "How We Work & What We Do" section and its timeline. */
export function HeritageEditor({ register, errors, disabled }: Props) {
  const heritageErrors = errors.heritage

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="about-heritage-eyebrow"
          label="Eyebrow"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.heritageEyebrow)}
          disabled={disabled}
          error={heritageErrors?.eyebrow?.message}
          {...register('heritage.eyebrow')}
        />
        <TextField
          id="about-heritage-title"
          label="Title"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.heritageTitle)}
          disabled={disabled}
          error={heritageErrors?.title?.message}
          {...register('heritage.title')}
        />
        <div className="sm:col-span-2">
          <TextArea
            id="about-heritage-narrative"
            label="Story narrative"
            rows={6}
            hint={aboutTextHint(ABOUT_TEXT_LIMITS.heritageNarrative)}
            disabled={disabled}
            error={heritageErrors?.narrative?.message}
            {...register('heritage.narrative')}
          />
        </div>
        <div className="sm:col-span-2">
          <TextArea
            id="about-heritage-approach"
            label="Our approach"
            rows={3}
            hint={aboutTextHint(ABOUT_TEXT_LIMITS.heritageApproach)}
            disabled={disabled}
            error={heritageErrors?.approach?.message}
            {...register('heritage.approach')}
          />
        </div>
        <TextField
          id="about-heritage-based-in-label"
          label="Based in label"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.heritageBasedInLabel)}
          disabled={disabled}
          error={heritageErrors?.basedInLabel?.message}
          {...register('heritage.basedInLabel')}
        />
        <TextField
          id="about-heritage-based-in-value"
          label="Based in value"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.heritageBasedInValue)}
          disabled={disabled}
          error={heritageErrors?.basedInValue?.message}
          {...register('heritage.basedInValue')}
        />
        <TextField
          id="about-heritage-approach-label"
          label="Approach heading label"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.heritageApproachLabel)}
          disabled={disabled}
          error={heritageErrors?.approachLabel?.message}
          {...register('heritage.approachLabel')}
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="font-label-md text-label-md font-semibold text-on-surface">
          Milestones
        </legend>
        <p className="font-body-sm text-body-sm text-secondary">
          Exactly {MILESTONE_COUNT} timeline entries. Accent colours are derived
          from the position; blank fields keep the public page value.
        </p>

        <div className="grid gap-4">
          {Array.from({ length: MILESTONE_COUNT }, (_, index) => {
            const milestoneErrors = heritageErrors?.milestones?.[index]
            return (
              <div
                key={index}
                className="grid gap-5 rounded-card border border-outline-variant bg-surface-container-low/40 p-5 sm:grid-cols-2"
              >
                <p className="font-label-sm text-label-sm font-semibold text-on-surface sm:col-span-2">
                  Milestone {index + 1}
                </p>
                <TextField
                  id={`about-heritage-milestone-${index}-kicker`}
                  label="Kicker"
                  hint={aboutTextHint(ABOUT_TEXT_LIMITS.milestoneKicker)}
                  disabled={disabled}
                  error={milestoneErrors?.kicker?.message}
                  {...register(
                    `heritage.milestones.${index}.kicker` as FieldPath<AboutFormValues>,
                  )}
                />
                <TextField
                  id={`about-heritage-milestone-${index}-badge`}
                  label="Badge"
                  hint={aboutTextHint(ABOUT_TEXT_LIMITS.milestoneBadge)}
                  disabled={disabled}
                  error={milestoneErrors?.badge?.message}
                  {...register(
                    `heritage.milestones.${index}.badge` as FieldPath<AboutFormValues>,
                  )}
                />
                <div className="sm:col-span-2">
                  <TextField
                    id={`about-heritage-milestone-${index}-title`}
                    label="Title"
                    hint={aboutTextHint(ABOUT_TEXT_LIMITS.milestoneTitle)}
                    disabled={disabled}
                    error={milestoneErrors?.title?.message}
                    {...register(
                      `heritage.milestones.${index}.title` as FieldPath<AboutFormValues>,
                    )}
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextArea
                    id={`about-heritage-milestone-${index}-description`}
                    label="Description"
                    rows={3}
                    hint={aboutTextHint(ABOUT_TEXT_LIMITS.milestoneDescription)}
                    disabled={disabled}
                    error={milestoneErrors?.description?.message}
                    {...register(
                      `heritage.milestones.${index}.description` as FieldPath<AboutFormValues>,
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

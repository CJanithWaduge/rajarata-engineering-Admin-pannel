import type { FieldErrors, FieldPath, UseFormRegister } from 'react-hook-form'
import { TextArea } from '../../../components/ui/TextArea'
import { TextField } from '../../../components/ui/TextField'
import {
  ABOUT_TEXT_LIMITS,
  SNAPSHOT_COUNT,
  aboutTextHint,
} from '../constants'
import type { AboutFormValues } from '../types'

type Props = {
  register: UseFormRegister<AboutFormValues>
  errors: FieldErrors<AboutFormValues>
  disabled: boolean
}

export function AboutHeroEditor({ register, errors, disabled }: Props) {
  const heroErrors = errors.hero

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="about-hero-eyebrow"
          label="Eyebrow"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.heroEyebrow)}
          disabled={disabled}
          error={heroErrors?.eyebrow?.message}
          {...register('hero.eyebrow')}
        />
        <TextField
          id="about-hero-title"
          label="Headline"
          hint={aboutTextHint(ABOUT_TEXT_LIMITS.heroTitle)}
          disabled={disabled}
          error={heroErrors?.title?.message}
          {...register('hero.title')}
        />
        <div className="sm:col-span-2">
          <TextArea
            id="about-hero-intro"
            label="Intro"
            rows={5}
            hint={aboutTextHint(ABOUT_TEXT_LIMITS.heroIntro)}
            disabled={disabled}
            error={heroErrors?.intro?.message}
            {...register('hero.intro')}
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            id="about-hero-alt"
            label="Image alt text"
            hint={`Describe the selected hero image for screen readers (up to ${ABOUT_TEXT_LIMITS.heroAlt} characters). Required only when you replace the public hero image.`}
            disabled={disabled}
            error={heroErrors?.alt?.message}
            {...register('hero.alt')}
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="font-label-md text-label-md font-semibold text-on-surface">
          Company snapshot
        </legend>
        <p className="font-body-sm text-body-sm text-secondary">
          Exactly {SNAPSHOT_COUNT} short badges under the hero copy. Leave a
          field blank to keep the public page value.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: SNAPSHOT_COUNT }, (_, index) => (
            <div
              key={index}
              className="grid gap-4 rounded-card border border-outline-variant bg-surface-container-low/40 p-4"
            >
              <TextField
                id={`about-hero-snapshot-${index}-title`}
                label={`Snapshot ${index + 1} title`}
                hint={aboutTextHint(ABOUT_TEXT_LIMITS.snapshotTitle)}
                disabled={disabled}
                error={heroErrors?.snapshots?.[index]?.title?.message}
                {...register(
                  `hero.snapshots.${index}.title` as FieldPath<AboutFormValues>,
                )}
              />
              <TextField
                id={`about-hero-snapshot-${index}-description`}
                label="Supporting line"
                hint={aboutTextHint(ABOUT_TEXT_LIMITS.snapshotDescription)}
                disabled={disabled}
                error={heroErrors?.snapshots?.[index]?.description?.message}
                {...register(
                  `hero.snapshots.${index}.description` as FieldPath<AboutFormValues>,
                )}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-label-md text-label-md font-semibold text-on-surface">
          Image overlay card
        </legend>
        <p className="font-body-sm text-body-sm text-secondary">
          The small panel shown over the hero image.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="about-hero-overlay-title"
            label="Overlay title"
            hint={aboutTextHint(ABOUT_TEXT_LIMITS.overlayTitle)}
            disabled={disabled}
            error={heroErrors?.overlay?.title?.message}
            {...register('hero.overlay.title')}
          />
          <TextField
            id="about-hero-overlay-stage"
            label="Work stage"
            hint={aboutTextHint(ABOUT_TEXT_LIMITS.overlayStage)}
            disabled={disabled}
            error={heroErrors?.overlay?.stage?.message}
            {...register('hero.overlay.stage')}
          />
          <div className="sm:col-span-2">
            <TextArea
              id="about-hero-overlay-description"
              label="Overlay description"
              rows={3}
              hint={aboutTextHint(ABOUT_TEXT_LIMITS.overlayDescription)}
              disabled={disabled}
              error={heroErrors?.overlay?.description?.message}
              {...register('hero.overlay.description')}
            />
          </div>
        </div>
      </fieldset>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { SettingsFormValues } from '../types'
import { SETTINGS_FIELDS } from '../defaults'
import { settingsSchema } from '../schema'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { Alert } from '../../../components/ui/Alert'
import { SettingsFieldGroup } from './SettingsFieldGroup'

type Props = {
  defaultValues: SettingsFormValues
  onSubmit: (values: SettingsFormValues) => void
  isSaving: boolean
  successMessage?: string | null
  errorMessage?: string | null
}

export function SettingsForm({
  defaultValues,
  onSubmit,
  isSaving,
  successMessage,
  errorMessage,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  })

  const prevDefault = useRef<SettingsFormValues>(defaultValues)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    if (JSON.stringify(prevDefault.current) !== JSON.stringify(defaultValues)) {
      prevDefault.current = defaultValues
      reset(defaultValues)
      setIsSubmitted(false)
    }
  }, [defaultValues, reset])

  const onFormSubmit = (values: SettingsFormValues) => {
    onSubmit(values)
    setIsSubmitted(true)
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onFormSubmit)} noValidate>
      {errorMessage ? (
        <Alert variant="error">
          {errorMessage}
        </Alert>
      ) : null}
      {isSubmitted && successMessage && !errorMessage ? (
        <Alert variant="success">
          {successMessage}
        </Alert>
      ) : null}

      <SettingsFieldGroup title="Contact">
        {SETTINGS_FIELDS.filter((field) => field.group === 'contact').map((field) => (
          <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}>
            <TextField
              {...register(field.key)}
              label={field.label}
              placeholder={field.placeholder}
              autoComplete={field.autocomplete}
              hint={field.hint}
              error={errors[field.key]?.message}
              tone="light"
              {...(field.type === 'textarea' ? { multiline: true, rows: 3 } : {})}
            />
          </div>
        ))}
      </SettingsFieldGroup>

      <SettingsFieldGroup title="Location">
        {SETTINGS_FIELDS.filter((field) => field.group === 'location').map((field) => (
          <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}>
            <TextField
              {...register(field.key)}
              label={field.label}
              placeholder={field.placeholder}
              hint={field.hint}
              error={errors[field.key]?.message}
              tone="light"
              {...(field.type === 'textarea' ? { multiline: true, rows: 3 } : {})}
            />
          </div>
        ))}
      </SettingsFieldGroup>

      <SettingsFieldGroup title="Links">
        {SETTINGS_FIELDS.filter((field) => field.group === 'links').map((field) => (
          <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : undefined}>
            <TextField
              {...register(field.key)}
              label={field.label}
              placeholder={field.placeholder}
              hint={field.hint}
              error={errors[field.key]?.message}
              tone="light"
              {...(field.type === 'textarea' ? { multiline: true, rows: 3 } : {})}
            />
          </div>
        ))}
      </SettingsFieldGroup>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSaving} disabled={!isDirty || isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { TextField } from '../../../components/ui/TextField'
import { sendAdminResetEmail } from '../authService'
import { toAuthError } from '../errors'
import { resetSchema } from '../schema'
import type { ResetValues } from '../schema'

interface ForgotPasswordDialogProps {
  onClose: () => void
}

export function ForgotPasswordDialog({ onClose }: ForgotPasswordDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  })

  const [isSent, setIsSent] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const onSubmit = handleSubmit(async (values) => {
    setErrorMessage(null)

    try {
      await sendAdminResetEmail(values.email)
      setSentTo(values.email)
      setIsSent(true)
    } catch (caught) {
      setErrorMessage(toAuthError(caught).message)
    }
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-inverse-surface/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-password-title"
        className="w-full max-w-md rounded-card border border-outline-variant bg-surface-container-lowest p-6 shadow-overlay sm:p-8"
      >
        <p className="font-label-caps text-label-caps uppercase tracking-widest text-primary">
          Account recovery
        </p>
        <h2
          id="reset-password-title"
          className="mt-1 font-headline-sm text-headline-sm text-on-surface"
        >
          Reset password
        </h2>

        {isSent ? (
          <div className="mt-5 space-y-5">
            <Alert variant="success">
              If an admin account exists for <strong>{sentTo}</strong>, a reset
              link is on its way.
            </Alert>
            <p className="font-body-sm text-body-sm text-secondary">
              Check the inbox and spam folder for that exact address, then
              return here to sign in. Nothing arriving usually means the address
              does not match an admin account.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <form noValidate onSubmit={onSubmit} className="mt-5 space-y-5">
            <p className="font-body-sm text-body-sm text-secondary">
              Enter the admin email address and we will send a password reset
              link.
            </p>

            {errorMessage ? <Alert>{errorMessage}</Alert> : null}

            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              placeholder="admin@example.com"
              error={errors.email?.message}
              disabled={isSubmitting}
              autoFocus
              {...register('email')}
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="flex-1"
              >
                Send reset link
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

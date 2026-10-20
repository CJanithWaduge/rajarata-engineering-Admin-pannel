import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { PasswordField } from '../../../components/ui/PasswordField'
import { TextField } from '../../../components/ui/TextField'
import { getRedirectTarget } from '../../../routes/redirect'
import { loginSchema } from '../schema'
import type { LoginValues } from '../schema'
import type { AuthError } from '../types'
import { useAuth } from '../useAuth'
import { ForgotPasswordDialog } from './ForgotPasswordDialog'

export function LoginForm() {
  const { login, error: sessionError, clearError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitError, setSubmitError] = useState<AuthError | null>(null)
  const [showResetDialog, setShowResetDialog] = useState(false)

  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  })

  const activeError = submitError ?? sessionError

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    clearError()

    const nextError = await login(values.email, values.password)

    if (!nextError) {
      const state = location.state as { from?: unknown } | null
      navigate(getRedirectTarget(state?.from), { replace: true })
      return
    }

    setSubmitError(nextError)
    resetField('password', { defaultValue: '' })
    setFocus('password')
  })

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      {activeError ? <Alert>{activeError.message}</Alert> : null}

      <TextField
        label="Email"
        type="email"
        autoComplete="username"
        error={errors.email?.message}
        disabled={isSubmitting}
        tone="dark"
        autoFocus
        {...register('email')}
      />

      <PasswordField
        label="Password"
        autoComplete="current-password"
        placeholder="Enter your password"
        error={errors.password?.message}
        disabled={isSubmitting}
        tone="dark"
        {...register('password')}
      />

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Sign in
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setShowResetDialog(true)}
          className="rounded-chip px-2 py-1 font-label-sm text-label-sm text-primary-fixed-dim transition-colors hover:text-white hover:underline focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-fixed-dim"
        >
          Forgot password?
        </button>
      </div>

      {showResetDialog ? (
        <ForgotPasswordDialog onClose={() => setShowResetDialog(false)} />
      ) : null}
    </form>
  )
}

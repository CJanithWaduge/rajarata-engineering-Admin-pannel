import { z } from 'zod'

const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .pipe(z.email('Enter a valid email address.'))

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required.'),
})

export const resetSchema = z.object({
  email: emailField,
})

export type LoginValues = z.infer<typeof loginSchema>
export type ResetValues = z.infer<typeof resetSchema>

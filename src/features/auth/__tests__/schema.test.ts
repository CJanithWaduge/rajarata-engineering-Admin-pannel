import { describe, expect, it } from 'vitest'
import { loginSchema, resetSchema } from '../schema'

describe('loginSchema', () => {
  it('trims and accepts a valid email and password', () => {
    const result = loginSchema.safeParse({
      email: '  admin@rajarata.test  ',
      password: 'CorrectHorse1!',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('admin@rajarata.test')
    }
  })

  it('rejects an empty email and password with required messages', () => {
    const result = loginSchema.safeParse({ email: '', password: '' })

    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message)
      expect(messages).toContain('Email is required.')
      expect(messages).toContain('Password is required.')
    }
  })

  it('rejects a malformed email', () => {
    const result = loginSchema.safeParse({
      email: 'admin@',
      password: 'CorrectHorse1!',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Enter a valid email address.',
      )
    }
  })

  it('does not impose a minimum password length by itself', () => {
    const result = loginSchema.safeParse({ email: 'admin@rajarata.test', password: 'x' })

    expect(result.success).toBe(true)
  })
})

describe('resetSchema', () => {
  it('requires a valid email only', () => {
    expect(resetSchema.safeParse({ email: 'admin@rajarata.test' }).success).toBe(
      true,
    )
    expect(resetSchema.safeParse({ email: '' }).success).toBe(false)
  })
})

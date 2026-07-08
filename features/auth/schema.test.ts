import { describe, expect, it } from 'vitest'

import { createFirstUserSchema, loginSchema } from '@/features/auth/schema'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'admin@example.com',
      password: 'secret',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'secret',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Enter a valid email address')
    }
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'admin@example.com',
      password: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Password is required')
    }
  })
})

describe('createFirstUserSchema', () => {
  it('accepts valid first-user input', () => {
    const result = createFirstUserSchema.safeParse({
      email: 'admin@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
      displayName: 'Admin User',
    })

    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = createFirstUserSchema.safeParse({
      email: 'admin@example.com',
      password: 'secret1',
      confirmPassword: 'secret2',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Passwords do not match')
    }
  })

  it('rejects passwords shorter than 6 characters', () => {
    const result = createFirstUserSchema.safeParse({
      email: 'admin@example.com',
      password: 'short',
      confirmPassword: 'short',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Password must be at least 6 characters'
      )
    }
  })
})

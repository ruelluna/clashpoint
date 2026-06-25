import { describe, expect, it } from 'vitest'

import { loginSchema } from '@/features/auth/schema'

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

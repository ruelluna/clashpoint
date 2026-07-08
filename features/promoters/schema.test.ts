import { describe, expect, it } from 'vitest'

import {
  createPromoterSchema,
  updatePromoterSchema,
} from '@/features/promoters/schema'

const basePromoter = {
  name: 'Acme Promotions',
  commissionType: 'none' as const,
  giveLoginAccess: false,
}

describe('createPromoterSchema commission validation', () => {
  it('accepts none commission without a value', () => {
    const result = createPromoterSchema.safeParse(basePromoter)
    expect(result.success).toBe(true)
  })

  it('requires commission value for fixed type', () => {
    const result = createPromoterSchema.safeParse({
      ...basePromoter,
      commissionType: 'fixed',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Commission value is required')
    }
  })

  it('rejects negative fixed commission', () => {
    const result = createPromoterSchema.safeParse({
      ...basePromoter,
      commissionType: 'fixed',
      commissionValue: -10,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Fixed commission must be zero or greater'
      )
    }
  })

  it('accepts valid fixed commission', () => {
    const result = createPromoterSchema.safeParse({
      ...basePromoter,
      commissionType: 'fixed',
      commissionValue: 500,
    })

    expect(result.success).toBe(true)
  })

  it('rejects percentage above 100', () => {
    const result = createPromoterSchema.safeParse({
      ...basePromoter,
      commissionType: 'percentage',
      commissionValue: 150,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Percentage must be between 0 and 100'
      )
    }
  })

  it('accepts valid percentage commission', () => {
    const result = createPromoterSchema.safeParse({
      ...basePromoter,
      commissionType: 'percentage',
      commissionValue: 12.5,
    })

    expect(result.success).toBe(true)
  })

  it('allows custom commission without a numeric value', () => {
    const result = createPromoterSchema.safeParse({
      ...basePromoter,
      commissionType: 'custom',
      notes: 'Negotiated per event',
    })

    expect(result.success).toBe(true)
  })
})

describe('createPromoterSchema login access validation', () => {
  it('requires login credentials when login access is enabled', () => {
    const result = createPromoterSchema.safeParse({
      ...basePromoter,
      giveLoginAccess: true,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message)
      expect(messages).toContain('Login email is required')
      expect(messages).toContain('Password must be at least 8 characters')
    }
  })

  it('accepts login credentials when login access is enabled', () => {
    const result = createPromoterSchema.safeParse({
      ...basePromoter,
      giveLoginAccess: true,
      loginEmail: 'promoter@example.com',
      loginPassword: 'secret123',
    })

    expect(result.success).toBe(true)
  })
})

describe('updatePromoterSchema commission validation', () => {
  it('requires commission value for percentage updates', () => {
    const result = updatePromoterSchema.safeParse({
      promoterId: '00000000-0000-4000-8000-000000000001',
      name: 'Acme Promotions',
      commissionType: 'percentage',
      status: 'active',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Commission value is required')
    }
  })
})

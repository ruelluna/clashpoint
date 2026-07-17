import { describe, expect, it } from 'vitest'

import {
  calculateBalance,
  generatePaymentReference,
  getNextPaymentReference,
  recordPaymentSchema,
} from '@/features/payments/schema'

describe('calculateBalance', () => {
  it('returns unpaid when nothing has been paid', () => {
    expect(calculateBalance(1000, 0)).toEqual({
      balance: 1000,
      paymentStatus: 'unpaid',
    })
  })

  it('returns partial when payment is below amount due', () => {
    expect(calculateBalance(1000, 400)).toEqual({
      balance: 600,
      paymentStatus: 'partial',
    })
  })

  it('returns paid when balance is zero', () => {
    expect(calculateBalance(1000, 1000)).toEqual({
      balance: 0,
      paymentStatus: 'paid',
    })
  })

  it('treats overpayment as paid with zero balance', () => {
    expect(calculateBalance(1000, 1200)).toEqual({
      balance: 0,
      paymentStatus: 'paid',
    })
  })
})

describe('payment reference helpers', () => {
  const eventId = '00000000-0000-4000-8000-000000000001'

  it('generates a stable payment reference prefix', () => {
    expect(generatePaymentReference(eventId, 1)).toBe('PAY-00000000-0001')
  })

  it('returns the next sequential payment reference for an event', () => {
    const existing = [
      'PAY-00000000-0001',
      'PAY-00000000-0002',
      'PAY-ABCDEF12-0001',
    ]

    expect(getNextPaymentReference(eventId, existing)).toBe('PAY-00000000-0003')
    expect(getNextPaymentReference(eventId, [])).toBe('PAY-00000000-0001')
  })
})

describe('recordPaymentSchema', () => {
  const eventId = '00000000-0000-4000-8000-000000000001'
  const entryId = '00000000-0000-4000-8000-000000000002'

  it('accepts cash without receipt number', () => {
    const result = recordPaymentSchema.safeParse({
      eventId,
      entryId,
      amountPaid: 500,
      paymentMethod: 'cash',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.receiptNumber).toBeUndefined()
    }
  })

  it('rejects gcash payments', () => {
    const result = recordPaymentSchema.safeParse({
      eventId,
      entryId,
      amountPaid: 500,
      paymentMethod: 'gcash',
      receiptNumber: 'GC-123',
    })

    expect(result.success).toBe(false)
  })

  it('rejects bank transfer payments', () => {
    const result = recordPaymentSchema.safeParse({
      eventId,
      entryId,
      amountPaid: 500,
      paymentMethod: 'bank_transfer',
      receiptNumber: 'BT-456',
    })

    expect(result.success).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'

import {
  closeCashierSessionSchema,
  openCashierSessionSchema,
  recordAdminHandoverSchema,
} from '@/features/cashier-sessions/schema'

const eventId = '00000000-0000-4000-8000-000000000001'
const sessionId = '00000000-0000-4000-8000-000000000002'

describe('openCashierSessionSchema', () => {
  it('accepts default opening float without note', () => {
    const parsed = openCashierSessionSchema.parse({
      eventId,
      openingFloatAmount: 1000,
      openingFloatDefault: 1000,
    })

    expect(parsed.openingFloatAmount).toBe(1000)
    expect(parsed.openingFloatNote).toBeUndefined()
  })

  it('requires note when amount differs from default', () => {
    const result = openCashierSessionSchema.safeParse({
      eventId,
      openingFloatAmount: 1200,
      openingFloatDefault: 1000,
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['openingFloatNote'])
    }
  })

  it('accepts adjusted float with note', () => {
    const parsed = openCashierSessionSchema.parse({
      eventId,
      openingFloatAmount: 1200,
      openingFloatDefault: 1000,
      openingFloatNote: 'Extra change requested by supervisor',
    })

    expect(parsed.openingFloatNote).toBe('Extra change requested by supervisor')
  })
})

describe('closeCashierSessionSchema', () => {
  it('accepts optional closing fields', () => {
    const parsed = closeCashierSessionSchema.parse({
      eventId,
      sessionId,
    })

    expect(parsed.closingCountedCash).toBeUndefined()
  })
})

describe('recordAdminHandoverSchema', () => {
  it('requires positive amount and reason', () => {
    const result = recordAdminHandoverSchema.safeParse({
      eventId,
      sessionId,
      amount: 0,
      description: 'ok',
    })

    expect(result.success).toBe(false)
  })
})

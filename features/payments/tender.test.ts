import { describe, expect, it } from 'vitest'

import { computeCashChange, roundMoney } from '@/features/payments/tender'

describe('roundMoney', () => {
  it('rounds to two decimal places', () => {
    expect(roundMoney(10.005)).toBe(10.01)
    expect(roundMoney(10.004)).toBe(10)
  })
})

describe('computeCashChange', () => {
  it('returns zero change when tender equals collected', () => {
    expect(computeCashChange(700, 700)).toEqual({ ok: true, changeGiven: 0 })
  })

  it('returns change when tender exceeds collected', () => {
    expect(computeCashChange(700, 1000)).toEqual({ ok: true, changeGiven: 300 })
  })

  it('supports partial collection with exact tender', () => {
    expect(computeCashChange(400, 400)).toEqual({ ok: true, changeGiven: 0 })
  })

  it('rejects tender below collected amount', () => {
    const result = computeCashChange(700, 500)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/at least/)
    }
  })
})

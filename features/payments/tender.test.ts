import { describe, expect, it } from 'vitest'

import {
  allocateSplitPaymentTender,
  clearedTenderFieldsForRefund,
  computeCashChange,
  roundMoney,
} from '@/features/payments/tender'

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

describe('clearedTenderFieldsForRefund', () => {
  it('returns null tender fields for payments_tender_change_check', () => {
    expect(clearedTenderFieldsForRefund()).toEqual({
      amount_tendered: null,
      change_given: null,
    })
  })
})

describe('allocateSplitPaymentTender', () => {
  it('allocates change to the last row only', () => {
    expect(allocateSplitPaymentTender([500, 300], 1000, 200)).toEqual([
      { amountTendered: 500, changeGiven: 0 },
      { amountTendered: 500, changeGiven: 200 },
    ])
  })

  it('supports exact tender with no change across split rows', () => {
    expect(allocateSplitPaymentTender([500, 100], 600, 0)).toEqual([
      { amountTendered: 500, changeGiven: 0 },
      { amountTendered: 100, changeGiven: 0 },
    ])
  })

  it('returns null tender fields when cash tender is omitted', () => {
    expect(allocateSplitPaymentTender([500, 300], undefined, undefined)).toEqual([
      { amountTendered: null, changeGiven: null },
      { amountTendered: null, changeGiven: null },
    ])
  })
})

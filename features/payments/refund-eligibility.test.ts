import { describe, expect, it } from 'vitest'

import {
  getPaymentRefundEligibility,
  hasRefundablePayments,
} from '@/features/payments/refund-eligibility'

describe('getPaymentRefundEligibility', () => {
  it('routes cash bond refunds through outstanding dues entry context', () => {
    expect(
      getPaymentRefundEligibility({
        paymentCategory: 'cash_bond',
        paymentStatus: 'paid',
        amountPaid: 1000,
      })
    ).toEqual({
      refundable: false,
      reason: 'Cash bond refund is available from Outstanding dues after all matches',
    })
  })

  it('blocks registration fee refunds', () => {
    expect(
      getPaymentRefundEligibility({
        paymentCategory: 'registration',
        paymentStatus: 'paid',
        amountPaid: 500,
      })
    ).toEqual({
      refundable: false,
      reason: 'Registration fees are non-refundable',
    })
  })

  it('blocks already refunded payments', () => {
    expect(
      getPaymentRefundEligibility({
        paymentCategory: 'cash_bond',
        paymentStatus: 'refunded',
        amountPaid: 0,
      })
    ).toEqual({
      refundable: false,
      reason: 'Already refunded',
    })
  })
})

describe('hasRefundablePayments', () => {
  it('returns true when at least one child payment is refundable', () => {
    expect(
      hasRefundablePayments([
        {
          paymentCategory: 'registration',
          paymentStatus: 'paid',
          amountPaid: 500,
        },
        {
          paymentCategory: 'match_bet',
          paymentStatus: 'paid',
          amountPaid: 1000,
        },
      ])
    ).toBe(true)
  })
})

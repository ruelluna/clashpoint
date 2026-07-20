import { describe, expect, it } from 'vitest'

import { sumPrizePoolFromPayments } from '@/features/events/prize-pool-utils'

describe('sumPrizePoolFromPayments', () => {
  it('sums registration, rooster entry, and entry_fees payments excluding refunds', () => {
    const total = sumPrizePoolFromPayments([
      {
        amountPaid: 500,
        paymentCategory: 'registration',
        paymentStatus: 'paid',
      },
      {
        amountPaid: 300,
        paymentCategory: 'rooster_entry',
        paymentStatus: 'partial',
      },
      {
        amountPaid: 900,
        paymentCategory: 'entry_fees',
        paymentStatus: 'paid',
      },
      {
        amountPaid: 100,
        paymentCategory: 'cash_bond',
        paymentStatus: 'paid',
      },
      {
        amountPaid: 50,
        paymentCategory: 'registration',
        paymentStatus: 'refunded',
      },
    ])

    expect(total).toBe(1700)
  })
})

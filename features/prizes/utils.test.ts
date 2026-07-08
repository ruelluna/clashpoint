import { describe, expect, it } from 'vitest'

import {
  computeGrossCollection,
  computePrizePool,
  computePromoterCommissionAmount,
  computeTotalDeductions,
  distributePrizes,
} from '@/features/prizes/utils'

describe('computeGrossCollection', () => {
  it('multiplies entry count by fee', () => {
    expect(computeGrossCollection(10, 500)).toBe(5000)
  })

  it('clamps negative inputs to zero', () => {
    expect(computeGrossCollection(-2, 500)).toBe(0)
  })
})

describe('computeTotalDeductions', () => {
  it('sums house deduction and venue share', () => {
    expect(computeTotalDeductions(200, 150)).toBe(350)
  })
})

describe('computePromoterCommissionAmount', () => {
  it('calculates percentage commission', () => {
    expect(computePromoterCommissionAmount(10000, 'percentage', 10)).toBe(1000)
  })

  it('returns fixed commission', () => {
    expect(computePromoterCommissionAmount(10000, 'fixed', 750)).toBe(750)
  })

  it('returns zero for none', () => {
    expect(computePromoterCommissionAmount(10000, 'none', 10)).toBe(0)
  })
})

describe('computePrizePool', () => {
  it('subtracts deductions and commission from gross', () => {
    const result = computePrizePool({
      entryCount: 20,
      entryFee: 500,
      houseDeduction: 500,
      venueShare: 500,
      promoterCommissionType: 'percentage',
      promoterCommissionValue: 10,
    })

    expect(result.grossCollection).toBe(10000)
    expect(result.totalDeductions).toBe(1000)
    expect(result.promoterCommission).toBe(1000)
    expect(result.netBeforeGuarantee).toBe(8000)
    expect(result.prizePool).toBe(8000)
  })

  it('uses guaranteed prize when higher than net pool', () => {
    const result = computePrizePool({
      entryCount: 5,
      entryFee: 500,
      guaranteedPrizeAmount: 10000,
    })

    expect(result.netBeforeGuarantee).toBe(2500)
    expect(result.prizePool).toBe(10000)
  })
})

describe('distributePrizes', () => {
  const winners = [
    {
      entryId: 'a',
      entryNumber: '1',
      entryName: 'Alpha',
      ownerName: 'Owner A',
      rank: 1,
    },
    {
      entryId: 'b',
      entryNumber: '2',
      entryName: 'Bravo',
      ownerName: 'Owner B',
      rank: 2,
    },
  ]

  it('distributes percentage prizes by place', () => {
    const allocations = distributePrizes(
      {
        prizeType: 'percentage',
        config: [
          { place: 1, label: 'Champion', value: 60 },
          { place: 2, label: 'Runner-up', value: 40 },
        ],
      },
      10000,
      winners
    )

    expect(allocations).toHaveLength(2)
    expect(allocations[0].amount).toBe(6000)
    expect(allocations[1].amount).toBe(4000)
  })

  it('splits tied champions equally', () => {
    const tiedWinners = [
      {
        entryId: 'a',
        entryNumber: '1',
        entryName: 'Alpha',
        ownerName: 'Owner A',
        rank: 1,
      },
      {
        entryId: 'b',
        entryNumber: '2',
        entryName: 'Bravo',
        ownerName: 'Owner B',
        rank: 1,
      },
    ]

    const allocations = distributePrizes(
      {
        prizeType: 'percentage',
        config: [{ place: 1, label: 'Champion', value: 100 }],
      },
      10000,
      tiedWinners
    )

    expect(allocations).toHaveLength(2)
    expect(allocations[0].amount).toBe(5000)
    expect(allocations[1].amount).toBe(5000)
  })
})

import { describe, expect, it } from 'vitest'

import { calculatePledgeSettlement } from '@/features/matches/bet-balancing'

describe('bet-balancing re-exports', () => {
  it('delegates to calculatePledgeSettlement', () => {
    const result = calculatePledgeSettlement({
      meronBasePledge: 25000,
      walaBasePledge: 25000,
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    expect(result.meronOdds).toBe(1.8)
    expect(result.walaOdds).toBe(1.8)
  })
})

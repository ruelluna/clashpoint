import { describe, expect, it } from 'vitest'

import {
  computeBetBalancing,
  getPledgeBaseAmount,
} from '@/features/matches/bet-balancing'

describe('computeBetBalancing', () => {
  it('computes imbalance, commission, odds, and winnings from screenshot-like totals', () => {
    const snapshot = computeBetBalancing({
      meronBase: 84258,
      walaBase: 84582,
      commissionRatePercent: 10,
      taxPerFight: 100,
    })

    expect(snapshot.meronTotal).toBe(84258)
    expect(snapshot.walaTotal).toBe(84582)
    expect(snapshot.totalPledges).toBe(168840)
    expect(snapshot.imbalance).toBe(324)
    expect(snapshot.imbalanceSide).toBe('meron')
    expect(snapshot.isBalanced).toBe(false)
    expect(snapshot.totalCommission).toBe(16884)
    expect(snapshot.taxPerFight).toBe(100)
    expect(snapshot.netPool).toBe(151856)
    expect(snapshot.meronOdds).toBe(1.8)
    expect(snapshot.walaOdds).toBe(1.8)
    expect(snapshot.meronWinningsPotential).toBe(151856)
    expect(snapshot.walaWinningsPotential).toBe(151856)
  })

  it('marks sides balanced when totals match', () => {
    const snapshot = computeBetBalancing({
      meronBase: 5000,
      walaBase: 5000,
      commissionRatePercent: 10,
      taxPerFight: 100,
    })

    expect(snapshot.isBalanced).toBe(true)
    expect(snapshot.imbalanceSide).toBeNull()
  })
})

describe('getPledgeBaseAmount', () => {
  it('uses collected amount when paid', () => {
    expect(getPledgeBaseAmount(500, 450, 'paid')).toBe(450)
  })

  it('uses agreed amount when unpaid', () => {
    expect(getPledgeBaseAmount(500, 0, 'unpaid')).toBe(500)
  })
})

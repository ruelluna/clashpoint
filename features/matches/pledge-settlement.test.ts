import { describe, expect, it } from 'vitest'

import {
  calculatePledgeSettlement,
  getPledgeBaseAmount,
  validatePalitadaContribution,
} from '@/features/matches/pledge-settlement'

describe('calculatePledgeSettlement', () => {
  it('matches Example 1 — balanced sides at 1.80 odds', () => {
    const result = calculatePledgeSettlement({
      meronBasePledge: 25000,
      walaBasePledge: 24000,
      walaPalitadaContributors: [
        {
          contributorName: 'VIP A',
          contributorType: 'vip',
          amount: 1000,
        },
      ],
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    expect(result.meronTotal).toBe(25000)
    expect(result.walaTotal).toBe(25000)
    expect(result.totalPool).toBe(50000)
    expect(result.totalCommission).toBe(5000)
    expect(result.totalTax).toBe(100)
    expect(result.totalWinningPool).toBe(44900)
    expect(result.meronOdds).toBe(1.8)
    expect(result.walaOdds).toBe(1.8)
    expect(result.isBalanced).toBe(true)
    expect(result.underdogSide).toBeNull()
  })

  it('matches Example 2 — imbalanced sides with favorite/underdog odds', () => {
    const result = calculatePledgeSettlement({
      meronBasePledge: 30000,
      walaBasePledge: 20000,
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    expect(result.totalPool).toBe(50000)
    expect(result.totalWinningPool).toBe(44900)
    expect(result.meronOdds).toBe(1.5)
    expect(result.walaOdds).toBe(2.25)
    expect(result.underdogSide).toBe('wala')
    expect(result.amountNeededToBalance).toBe(10000)
    expect(result.isBalanced).toBe(false)
  })

  it('matches Example 3 — higher derby tax lowers balanced odds', () => {
    const result = calculatePledgeSettlement({
      meronBasePledge: 25000,
      walaBasePledge: 24000,
      walaPalitadaContributors: [
        {
          contributorName: 'Monton',
          contributorType: 'monton',
          amount: 1000,
        },
      ],
      commissionRatePercent: 10,
      taxAmount: 200,
    })

    expect(result.totalWinningPool).toBe(44800)
    expect(result.meronOdds).toBe(1.79)
    expect(result.walaOdds).toBe(1.79)
    expect(result.montonHouseEarnings).toBe(5200)
  })

  it('splits winnings proportionally between owner and palitada contributors', () => {
    const result = calculatePledgeSettlement({
      meronBasePledge: 12000,
      walaBasePledge: 3000,
      walaPalitadaContributors: [
        {
          id: 'c1',
          contributorName: 'Monton fund',
          contributorType: 'monton',
          amount: 9000,
        },
      ],
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    expect(result.isBalanced).toBe(true)
    expect(result.totalWinningPool).toBe(21500)
    expect(result.wala.ownerShare).toBe(5375)
    expect(result.wala.contributorShare).toBe(5375)
    expect(result.wala.contributors[0]?.winnings).toBe(16125)
    expect(result.meron.ownerShare).toBe(21500)
  })

  it('computes draw refunds per contributor after commission and proportional tax', () => {
    const result = calculatePledgeSettlement({
      meronBasePledge: 25000,
      walaBasePledge: 24000,
      walaPalitadaContributors: [
        {
          contributorName: 'VIP A',
          contributorType: 'vip',
          amount: 1000,
        },
      ],
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    const contributor = result.wala.contributors[0]
    expect(contributor?.drawNetRefund).toBe(898)
  })

  it('returns default odds of 2.0 when a side total is zero', () => {
    const result = calculatePledgeSettlement({
      meronBasePledge: 5000,
      walaBasePledge: 0,
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    expect(result.walaOdds).toBe(2.0)
    expect(result.meronOdds).toBeGreaterThan(0)
    expect(result.walaTotal).toBe(0)
  })

  it('computes side-specific handler winnings as profit after stake for imbalanced pledges', () => {
    const result = calculatePledgeSettlement({
      meronBasePledge: 12000,
      walaBasePledge: 10000,
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    expect(result.totalPool).toBe(22000)
    expect(result.totalWinningPool).toBe(19700)
    expect(result.montonHouseEarnings).toBe(2300)
    expect(result.montonHouseEarnings + result.totalWinningPool).toBe(result.totalPool)
    expect(result.meron.handlerPayout).toBe(19700)
    expect(result.wala.handlerPayout).toBe(19700)
    expect(result.meron.sideWinTotal).toBe(19700)
    expect(result.wala.sideWinTotal).toBe(19700)
    expect(result.meron.handlerWinnings).toBe(7700)
    expect(result.wala.handlerWinnings).toBe(9700)
    expect(result.meron.handlerWinnings).not.toBe(result.wala.handlerWinnings)
  })

  it('balances gross pool as monton plus side win total including palitada payouts', () => {
    const result = calculatePledgeSettlement({
      meronBasePledge: 12000,
      walaBasePledge: 3000,
      walaPalitadaContributors: [
        {
          contributorName: 'Monton fund',
          contributorType: 'monton',
          amount: 9000,
        },
      ],
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    expect(result.montonHouseEarnings + result.wala.sideWinTotal).toBe(result.totalPool)
    expect(result.wala.sideWinTotal).toBe(result.totalWinningPool)
    expect(result.wala.handlerPayout + result.wala.contributors[0]!.winnings).toBe(
      result.wala.sideWinTotal
    )
  })

  it('tracks monton house earnings as total commission plus total tax', () => {
    const result = calculatePledgeSettlement({
      meronBasePledge: 12000,
      walaBasePledge: 10000,
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    expect(result.montonHouseEarnings).toBe(result.totalCommission + result.totalTax)
    expect(result.montonHouseEarnings).toBe(2300)
  })
})

describe('validatePalitadaContribution', () => {
  it('rejects palitada on the favorite side', () => {
    const settlement = calculatePledgeSettlement({
      meronBasePledge: 30000,
      walaBasePledge: 20000,
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    expect(
      validatePalitadaContribution({
        settlement,
        side: 'meron',
        amount: 1000,
      })
    ).toMatch(/underdog/)
  })

  it('rejects palitada above amount needed to balance', () => {
    const settlement = calculatePledgeSettlement({
      meronBasePledge: 30000,
      walaBasePledge: 20000,
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    expect(
      validatePalitadaContribution({
        settlement,
        side: 'wala',
        amount: 10001,
      })
    ).toMatch(/cannot exceed/)
  })

  it('accepts valid underdog palitada within balance capacity', () => {
    const settlement = calculatePledgeSettlement({
      meronBasePledge: 30000,
      walaBasePledge: 20000,
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    expect(
      validatePalitadaContribution({
        settlement,
        side: 'wala',
        amount: 5000,
      })
    ).toBeNull()
  })

  it('accepts incremental palitada up to the remaining balance gap', () => {
    const settlement = calculatePledgeSettlement({
      meronBasePledge: 50000,
      walaBasePledge: 5000,
      walaPalitadaContributors: [
        {
          contributorName: 'VIP Guest',
          contributorType: 'vip',
          amount: 40500,
        },
      ],
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    expect(settlement.amountNeededToBalance).toBe(4500)

    expect(
      validatePalitadaContribution({
        settlement,
        side: 'wala',
        amount: 500,
      })
    ).toBeNull()

    expect(
      validatePalitadaContribution({
        settlement,
        side: 'wala',
        amount: 4501,
      })
    ).toMatch(/cannot exceed/)
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

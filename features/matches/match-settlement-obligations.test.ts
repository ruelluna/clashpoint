import { describe, expect, it } from 'vitest'

import {
  buildMatchSettlementObligations,
  allRequiredObligationsPosted,
} from '@/features/matches/match-settlement-obligations'
import { calculatePledgeSettlement } from '@/features/matches/pledge-settlement'

describe('buildMatchSettlementObligations', () => {
  it('creates monton stake and payout obligations for a winning side', () => {
    const settlement = calculatePledgeSettlement({
      meronBasePledge: 30000,
      walaBasePledge: 20000,
      meronPalitadaContributors: [],
      walaPalitadaContributors: [
        {
          id: 'monton-1',
          contributorName: 'Monton',
          contributorType: 'monton',
          amount: 10000,
        },
      ],
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    const obligations = buildMatchSettlementObligations(settlement, 'wala_win')

    expect(obligations.some((row) => row.obligationKey === 'monton_palitada:monton-1:stake')).toBe(
      true
    )
    expect(obligations.some((row) => row.obligationKey === 'monton_palitada:monton-1:payout')).toBe(
      true
    )
    expect(
      obligations.find((row) => row.obligationKey === 'monton_palitada:monton-1:stake')?.amount
    ).toBeLessThan(0)
  })

  it('creates draw refund obligation for monton palitada on draw', () => {
    const settlement = calculatePledgeSettlement({
      meronBasePledge: 30000,
      walaBasePledge: 20000,
      meronPalitadaContributors: [],
      walaPalitadaContributors: [
        {
          id: 'monton-1',
          contributorName: 'Monton',
          contributorType: 'monton',
          amount: 10000,
        },
      ],
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    const obligations = buildMatchSettlementObligations(settlement, 'draw')

    expect(
      obligations.some((row) => row.obligationKey === 'monton_palitada:monton-1:draw_refund')
    ).toBe(true)
  })
})

describe('allRequiredObligationsPosted', () => {
  it('returns true only when required rows are posted', () => {
    expect(
      allRequiredObligationsPosted([
        { requires_ledger_post: true, status: 'posted' },
        { requires_ledger_post: false, status: 'pending' },
      ])
    ).toBe(true)

    expect(
      allRequiredObligationsPosted([
        { requires_ledger_post: true, status: 'pending' },
      ])
    ).toBe(false)
  })
})

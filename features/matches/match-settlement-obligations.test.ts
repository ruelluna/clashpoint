import { describe, expect, it } from 'vitest'

import {
  allHandlerObligationsPaid,
  allObligationsComplete,
  allRequiredObligationsPosted,
  allVipObligationsPaid,
  buildMatchSettlementObligations,
  countHandlerObligations,
  countVipObligations,
  listUnpaidHandlerObligationLabels,
  listUnpaidVipObligationLabels,
} from '@/features/matches/match-settlement-obligations'
import { calculatePledgeSettlement } from '@/features/matches/pledge-settlement'

describe('buildMatchSettlementObligations', () => {
  it('creates handler win payout before VIP rows on winning side', () => {
    const settlement = calculatePledgeSettlement({
      meronBasePledge: 1000,
      walaBasePledge: 1000,
      meronPalitadaContributors: [],
      walaPalitadaContributors: [],
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    const obligations = buildMatchSettlementObligations(settlement, 'wala_win', {
      meronEntryName: 'Meron Team',
      walaEntryName: 'Wala Team',
    })

    const handlerWin = obligations.find((row) => row.obligationKey === 'handler:wala:win_payout')
    const firstVipIndex = obligations.findIndex((row) =>
      row.obligationKey.startsWith('vip_palitada:')
    )

    expect(handlerWin).toMatchObject({
      obligationType: 'handler_win_payout',
      requiresLedgerPost: false,
      amount: settlement.wala.handlerPayout,
    })
    expect(handlerWin?.sortOrder).toBeLessThan(
      firstVipIndex === -1 ? obligations.length : firstVipIndex
    )
    expect(obligations.some((row) => row.obligationKey === 'handler:meron:win_payout')).toBe(
      false
    )
  })

  it('creates dual handler draw refunds on draw', () => {
    const settlement = calculatePledgeSettlement({
      meronBasePledge: 1000,
      walaBasePledge: 1000,
      meronPalitadaContributors: [],
      walaPalitadaContributors: [],
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    const obligations = buildMatchSettlementObligations(settlement, 'draw', {
      meronEntryName: 'Meron Team',
      walaEntryName: 'Wala Team',
    })

    expect(obligations.some((row) => row.obligationKey === 'handler:meron:draw_refund')).toBe(
      true
    )
    expect(obligations.some((row) => row.obligationKey === 'handler:wala:draw_refund')).toBe(true)
  })

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

  it('creates VIP payout when contributor side wins', () => {
    const settlement = calculatePledgeSettlement({
      meronBasePledge: 30000,
      walaBasePledge: 20000,
      meronPalitadaContributors: [],
      walaPalitadaContributors: [
        {
          id: 'vip-1',
          contributorName: 'VIP Winner',
          contributorType: 'vip',
          amount: 5000,
        },
      ],
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    const obligations = buildMatchSettlementObligations(settlement, 'wala_win')
    const payout = obligations.find((row) => row.obligationKey === 'vip_palitada:vip-1:payout')

    expect(payout).toMatchObject({
      obligationType: 'vip_palitada_payout',
      requiresLedgerPost: false,
    })
    expect(payout?.amount).toBeGreaterThan(0)
  })

  it('creates VIP collect when contributor side loses', () => {
    const settlement = calculatePledgeSettlement({
      meronBasePledge: 30000,
      walaBasePledge: 20000,
      meronPalitadaContributors: [
        {
          id: 'vip-2',
          contributorName: 'VIP Loser',
          contributorType: 'vip',
          amount: 4000,
        },
      ],
      walaPalitadaContributors: [],
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    const obligations = buildMatchSettlementObligations(settlement, 'wala_win')
    const collect = obligations.find((row) => row.obligationKey === 'vip_palitada:vip-2:collect')

    expect(collect).toMatchObject({
      obligationType: 'vip_palitada_collect',
      amount: 4000,
      requiresLedgerPost: false,
    })
  })

  it('creates VIP draw refund on draw', () => {
    const settlement = calculatePledgeSettlement({
      meronBasePledge: 30000,
      walaBasePledge: 20000,
      meronPalitadaContributors: [
        {
          id: 'vip-3',
          contributorName: 'VIP Draw',
          contributorType: 'vip',
          amount: 3000,
        },
      ],
      walaPalitadaContributors: [],
      commissionRatePercent: 10,
      taxAmount: 100,
    })

    const obligations = buildMatchSettlementObligations(settlement, 'draw')
    const refund = obligations.find((row) => row.obligationKey === 'vip_palitada:vip-3:draw_refund')

    expect(refund).toMatchObject({
      obligationType: 'vip_palitada_draw_refund',
      requiresLedgerPost: false,
    })
    expect(refund?.amount).toBeGreaterThan(0)
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

describe('allVipObligationsPaid', () => {
  it('returns true only when VIP rows are paid', () => {
    expect(
      allVipObligationsPaid([
        { obligation_type: 'vip_palitada_payout', status: 'paid' },
        { obligation_type: 'monton_palitada_stake', status: 'pending' },
      ])
    ).toBe(true)

    expect(
      allVipObligationsPaid([
        { obligation_type: 'vip_palitada_collect', status: 'pending' },
      ])
    ).toBe(false)
  })
})

describe('allHandlerObligationsPaid', () => {
  it('returns true only when handler rows are paid', () => {
    expect(
      allHandlerObligationsPaid([
        { obligation_type: 'handler_win_payout', status: 'paid' },
        { obligation_type: 'vip_palitada_payout', status: 'pending' },
      ])
    ).toBe(true)

    expect(
      allHandlerObligationsPaid([
        { obligation_type: 'handler_draw_refund', status: 'pending' },
      ])
    ).toBe(false)
  })
})

describe('allObligationsComplete', () => {
  it('requires ledger posts, handler payouts, and VIP payments', () => {
    expect(
      allObligationsComplete([
        {
          obligation_type: 'monton_palitada_stake',
          requires_ledger_post: true,
          status: 'posted',
        },
        {
          obligation_type: 'handler_win_payout',
          requires_ledger_post: false,
          status: 'paid',
        },
        {
          obligation_type: 'vip_palitada_payout',
          requires_ledger_post: false,
          status: 'paid',
        },
      ])
    ).toBe(true)

    expect(
      allObligationsComplete([
        {
          obligation_type: 'monton_palitada_stake',
          requires_ledger_post: true,
          status: 'posted',
        },
        {
          obligation_type: 'handler_win_payout',
          requires_ledger_post: false,
          status: 'pending',
        },
        {
          obligation_type: 'vip_palitada_payout',
          requires_ledger_post: false,
          status: 'paid',
        },
      ])
    ).toBe(false)
  })
})

describe('allObligationsComplete legacy', () => {
  it('requires both ledger posts and VIP payments', () => {
    expect(
      allObligationsComplete([
        {
          obligation_type: 'monton_palitada_stake',
          requires_ledger_post: true,
          status: 'posted',
        },
        {
          obligation_type: 'vip_palitada_payout',
          requires_ledger_post: false,
          status: 'paid',
        },
      ])
    ).toBe(true)

    expect(
      allObligationsComplete([
        {
          obligation_type: 'monton_palitada_stake',
          requires_ledger_post: true,
          status: 'posted',
        },
        {
          obligation_type: 'vip_palitada_payout',
          requires_ledger_post: false,
          status: 'pending',
        },
      ])
    ).toBe(false)
  })
})

describe('countHandlerObligations', () => {
  it('counts handler rows separately from VIP and monton', () => {
    expect(
      countHandlerObligations([
        { obligation_type: 'handler_win_payout', requires_ledger_post: false, status: 'paid' },
        { obligation_type: 'handler_draw_refund', requires_ledger_post: false, status: 'pending' },
        { obligation_type: 'vip_palitada_payout', requires_ledger_post: false, status: 'paid' },
      ])
    ).toEqual({ total: 2, paid: 1 })
  })
})

describe('listUnpaidHandlerObligationLabels', () => {
  it('returns labels for unpaid handler obligations', () => {
    expect(
      listUnpaidHandlerObligationLabels([
        {
          obligation_type: 'handler_win_payout',
          requires_ledger_post: false,
          status: 'pending',
          label: 'Pay handler — Juan',
        },
        {
          obligation_type: 'handler_draw_refund',
          requires_ledger_post: false,
          status: 'paid',
          label: 'Draw refund — Maria',
        },
      ])
    ).toEqual(['Pay handler — Juan'])
  })
})

describe('countVipObligations', () => {
  it('counts VIP rows separately from monton', () => {
    expect(
      countVipObligations([
        { obligation_type: 'vip_palitada_payout', requires_ledger_post: false, status: 'paid' },
        { obligation_type: 'vip_palitada_collect', requires_ledger_post: false, status: 'pending' },
        { obligation_type: 'monton_palitada_stake', requires_ledger_post: true, status: 'posted' },
      ])
    ).toEqual({ total: 2, paid: 1 })
  })
})

describe('listUnpaidVipObligationLabels', () => {
  it('returns labels for unpaid VIP obligations', () => {
    expect(
      listUnpaidVipObligationLabels([
        {
          obligation_type: 'vip_palitada_payout',
          requires_ledger_post: false,
          status: 'pending',
          label: 'Pay VIP — Juan',
        },
        {
          obligation_type: 'vip_palitada_collect',
          requires_ledger_post: false,
          status: 'paid',
          label: 'Collect from VIP — Maria',
        },
      ])
    ).toEqual(['Pay VIP — Juan'])
  })
})

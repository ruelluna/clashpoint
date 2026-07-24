import { roundMatchMoney } from '@/features/matches/utils'

import {

  computeHandlerDrawRefund,

  type PledgeSettlementResult,

} from '@/features/matches/pledge-settlement'

import type { RevolvingFundEntryType } from '@/features/revolving-fund/types'

import type { FightResultType } from '@/features/results/types'



export type MatchSettlementObligationType =

  | 'handler_win_payout'

  | 'handler_draw_refund'

  | 'monton_palitada_stake'

  | 'monton_palitada_payout'

  | 'monton_palitada_draw_refund'

  | 'monton_house_earnings'

  | 'vip_palitada_payout'

  | 'vip_palitada_collect'

  | 'vip_palitada_draw_refund'



export const HANDLER_SETTLEMENT_OBLIGATION_TYPES: MatchSettlementObligationType[] = [

  'handler_win_payout',

  'handler_draw_refund',

]



export const VIP_SETTLEMENT_OBLIGATION_TYPES: MatchSettlementObligationType[] = [

  'vip_palitada_payout',

  'vip_palitada_collect',

  'vip_palitada_draw_refund',

]



export type MatchSettlementObligationDraft = {

  obligationKey: string

  obligationType: MatchSettlementObligationType

  amount: number

  label: string

  description: string | null

  contributorId: string | null

  requiresLedgerPost: boolean

  sortOrder: number

}



export type MatchSettlementObligationRow = {

  obligation_type: MatchSettlementObligationType | 'vip_palitada_payout_info'

  requires_ledger_post: boolean

  status: 'pending' | 'posted' | 'paid'

  label?: string

}



export type MatchSettlementEntryNames = {

  meronEntryName: string

  walaEntryName: string

}



export function isHandlerSettlementObligationType(

  obligationType: string

): obligationType is 'handler_win_payout' | 'handler_draw_refund' {

  return HANDLER_SETTLEMENT_OBLIGATION_TYPES.includes(

    obligationType as MatchSettlementObligationType

  )

}



export function isVipSettlementObligationType(

  obligationType: string

): obligationType is

  | 'vip_palitada_payout'

  | 'vip_palitada_collect'

  | 'vip_palitada_draw_refund' {

  return VIP_SETTLEMENT_OBLIGATION_TYPES.includes(

    obligationType as MatchSettlementObligationType

  )

}



function didSideWin(resultType: FightResultType, side: 'meron' | 'wala'): boolean {

  if (resultType === 'meron_win') return side === 'meron'

  if (resultType === 'wala_win') return side === 'wala'

  return false

}



function didSideLose(resultType: FightResultType, side: 'meron' | 'wala'): boolean {

  if (resultType === 'meron_win') return side === 'wala'

  if (resultType === 'wala_win') return side === 'meron'

  return false

}



function buildHandlerObligations(

  settlement: PledgeSettlementResult,

  resultType: FightResultType,

  entryNames: MatchSettlementEntryNames,

  sortOrderStart: number

): MatchSettlementObligationDraft[] {

  const obligations: MatchSettlementObligationDraft[] = []

  let sortOrder = sortOrderStart



  const sides = [

    {

      side: 'meron' as const,

      breakdown: settlement.meron,

      entryName: entryNames.meronEntryName,

    },

    {

      side: 'wala' as const,

      breakdown: settlement.wala,

      entryName: entryNames.walaEntryName,

    },

  ]



  if (resultType === 'draw') {

    for (const { side, breakdown, entryName } of sides) {

      const drawRefund = computeHandlerDrawRefund(

        breakdown.basePledge,

        breakdown.sideTotal,

        settlement.commissionRate,

        settlement.taxAmount

      )

      if (drawRefund <= 0) continue



      const sideLabel = side === 'meron' ? 'Meron' : 'Wala'

      obligations.push({

        obligationKey: `handler:${side}:draw_refund`,

        obligationType: 'handler_draw_refund',

        amount: roundMatchMoney(drawRefund),

        label: `Draw refund — ${entryName}`,

        description: `${sideLabel} · Return ₱${drawRefund.toFixed(2)} from revolving fund after draw`,

        contributorId: null,

        requiresLedgerPost: false,

        sortOrder: sortOrder++,

      })

    }

    return obligations

  }



  for (const { side, breakdown, entryName } of sides) {

    if (!didSideWin(resultType, side) || breakdown.handlerPayout <= 0) continue

    const sideLabel = side === 'meron' ? 'Meron' : 'Wala'

    obligations.push({

      obligationKey: `handler:${side}:win_payout`,

      obligationType: 'handler_win_payout',

      amount: roundMatchMoney(breakdown.handlerPayout),

      label: `Pay handler — ${entryName}`,

      description: `${sideLabel} · Bet ₱${breakdown.basePledge.toFixed(2)} + won ₱${breakdown.handlerWinnings.toFixed(2)} · Pay ₱${breakdown.handlerPayout.toFixed(2)} from revolving fund`,

      contributorId: null,

      requiresLedgerPost: false,

      sortOrder: sortOrder++,

    })

  }



  return obligations

}



export function buildMatchSettlementObligations(

  settlement: PledgeSettlementResult,

  resultType: FightResultType,

  entryNames: MatchSettlementEntryNames = {

    meronEntryName: 'Meron',

    walaEntryName: 'Wala',

  }

): MatchSettlementObligationDraft[] {

  const obligations: MatchSettlementObligationDraft[] = []

  let sortOrder = 0



  obligations.push(

    ...buildHandlerObligations(settlement, resultType, entryNames, sortOrder)

  )

  sortOrder += obligations.length



  const sides = [

    { side: 'meron' as const, breakdown: settlement.meron },

    { side: 'wala' as const, breakdown: settlement.wala },

  ]



  for (const { side, breakdown } of sides) {

    for (const contributor of breakdown.contributors) {

      if (contributor.contributorType === 'monton') {

        const contributorId = contributor.id

        if (!contributorId) continue



        obligations.push({

          obligationKey: `monton_palitada:${contributorId}:stake`,

          obligationType: 'monton_palitada_stake',

          amount: roundMatchMoney(-contributor.amount),

          label: `Monton Palitada stake — ${side === 'meron' ? 'Meron' : 'Wala'}`,

          description: `${contributor.contributorName} · deploy ₱${contributor.amount.toFixed(2)} from revolving fund`,

          contributorId,

          requiresLedgerPost: true,

          sortOrder: sortOrder++,

        })



        if (resultType === 'draw' && contributor.drawNetRefund > 0) {

          obligations.push({

            obligationKey: `monton_palitada:${contributorId}:draw_refund`,

            obligationType: 'monton_palitada_draw_refund',

            amount: roundMatchMoney(contributor.drawNetRefund),

            label: `Monton Palitada draw refund — ${contributor.contributorName}`,

            description: `Return ₱${contributor.drawNetRefund.toFixed(2)} to revolving fund after draw`,

            contributorId,

            requiresLedgerPost: true,

            sortOrder: sortOrder++,

          })

        } else if (didSideWin(resultType, side) && contributor.winnings > 0) {

          obligations.push({

            obligationKey: `monton_palitada:${contributorId}:payout`,

            obligationType: 'monton_palitada_payout',

            amount: roundMatchMoney(contributor.winnings),

            label: `Monton Palitada win return — ${contributor.contributorName}`,

            description: `Return ₱${contributor.winnings.toFixed(2)} to revolving fund`,

            contributorId,

            requiresLedgerPost: true,

            sortOrder: sortOrder++,

          })

        }

      }



      if (contributor.contributorType === 'vip') {

        const contributorId = contributor.id

        if (!contributorId) continue



        const sideLabel = side === 'meron' ? 'Meron' : 'Wala'



        if (resultType === 'draw' && contributor.drawNetRefund > 0) {

          obligations.push({

            obligationKey: `vip_palitada:${contributorId}:draw_refund`,

            obligationType: 'vip_palitada_draw_refund',

            amount: roundMatchMoney(contributor.drawNetRefund),

            label: `Refund VIP — ${contributor.contributorName}`,

            description: `${sideLabel} · Draw refund ₱${contributor.drawNetRefund.toFixed(2)}`,

            contributorId,

            requiresLedgerPost: false,

            sortOrder: sortOrder++,

          })

        } else if (didSideWin(resultType, side) && contributor.winnings > 0) {

          obligations.push({

            obligationKey: `vip_palitada:${contributorId}:payout`,

            obligationType: 'vip_palitada_payout',

            amount: roundMatchMoney(contributor.winnings),

            label: `Pay VIP — ${contributor.contributorName}`,

            description: `${sideLabel} wins · Pay ₱${contributor.winnings.toFixed(2)} to VIP`,

            contributorId,

            requiresLedgerPost: false,

            sortOrder: sortOrder++,

          })

        } else if (didSideLose(resultType, side) && contributor.amount > 0) {

          obligations.push({

            obligationKey: `vip_palitada:${contributorId}:collect`,

            obligationType: 'vip_palitada_collect',

            amount: roundMatchMoney(contributor.amount),

            label: `Collect from VIP — ${contributor.contributorName}`,

            description: `${sideLabel} loses · Collect ₱${contributor.amount.toFixed(2)} from VIP`,

            contributorId,

            requiresLedgerPost: false,

            sortOrder: sortOrder++,

          })

        }

      }

    }

  }



  if (settlement.montonHouseEarnings > 0) {

    obligations.push({

      obligationKey: 'monton_house_earnings',

      obligationType: 'monton_house_earnings',

      amount: roundMatchMoney(settlement.montonHouseEarnings),

      label: 'Monton house earnings',

      description: `Commission and tax · ₱${settlement.montonHouseEarnings.toFixed(2)} to revolving fund`,

      contributorId: null,

      requiresLedgerPost: true,

      sortOrder: sortOrder++,

    })

  }



  return obligations

}



export function allRequiredObligationsPosted(

  obligations: Array<{ requires_ledger_post: boolean; status: 'pending' | 'posted' | 'paid' }>

): boolean {

  return obligations

    .filter((row) => row.requires_ledger_post)

    .every((row) => row.status === 'posted')

}



export function allHandlerObligationsPaid(

  obligations: Array<{ obligation_type: string; status: 'pending' | 'posted' | 'paid' }>

): boolean {

  return obligations

    .filter((row) => isHandlerSettlementObligationType(row.obligation_type))

    .every((row) => row.status === 'paid')

}



export function allVipObligationsPaid(

  obligations: Array<{ obligation_type: string; status: 'pending' | 'posted' | 'paid' }>

): boolean {

  return obligations

    .filter((row) => isVipSettlementObligationType(row.obligation_type))

    .every((row) => row.status === 'paid')

}



export function allObligationsComplete(obligations: MatchSettlementObligationRow[]): boolean {

  return (

    allRequiredObligationsPosted(obligations) &&

    allHandlerObligationsPaid(obligations) &&

    allVipObligationsPaid(obligations)

  )

}



export function countHandlerObligations(obligations: MatchSettlementObligationRow[]): {

  total: number

  paid: number

} {

  const handlerRows = obligations.filter((row) =>

    isHandlerSettlementObligationType(row.obligation_type)

  )

  return {

    total: handlerRows.length,

    paid: handlerRows.filter((row) => row.status === 'paid').length,

  }

}



export function countVipObligations(obligations: MatchSettlementObligationRow[]): {

  total: number

  paid: number

} {

  const vipRows = obligations.filter((row) =>

    isVipSettlementObligationType(row.obligation_type)

  )

  return {

    total: vipRows.length,

    paid: vipRows.filter((row) => row.status === 'paid').length,

  }

}



export function listUnpaidHandlerObligationLabels(

  obligations: MatchSettlementObligationRow[]

): string[] {

  return obligations

    .filter(

      (row) =>

        isHandlerSettlementObligationType(row.obligation_type) && row.status !== 'paid'

    )

    .map((row) => row.label ?? row.obligation_type)

}



export function listUnpaidVipObligationLabels(

  obligations: MatchSettlementObligationRow[]

): string[] {

  return obligations

    .filter(

      (row) =>

        isVipSettlementObligationType(row.obligation_type) && row.status !== 'paid'

    )

    .map((row) => row.label ?? row.obligation_type)

}



export function vipObligationActionLabel(

  obligationType: MatchSettlementObligationType

): string {

  switch (obligationType) {

    case 'vip_palitada_payout':

      return 'Pay'

    case 'vip_palitada_collect':

      return 'Collect'

    case 'vip_palitada_draw_refund':

      return 'Refund'

    default:

      return 'Settle'

  }

}



export function handlerObligationSideFromDescription(

  description: string | null

): 'Meron' | 'Wala' | '—' {

  if (!description) return '—'

  const side = description.split(' · ')[0]?.trim()

  return side === 'Meron' || side === 'Wala' ? side : '—'

}



export function handlerContributorName(label: string): string {

  const prefixes = ['Pay handler — ', 'Draw refund — ']

  for (const prefix of prefixes) {

    if (label.startsWith(prefix)) return label.slice(prefix.length)

  }

  return label

}

export type VipSettlementObligationType =

  | 'vip_palitada_payout'

  | 'vip_palitada_collect'

  | 'vip_palitada_draw_refund'

export function revolvingFundLedgerAmountForVipObligation(

  obligationType: VipSettlementObligationType,

  amount: number

): number {

  const normalized = roundMatchMoney(Math.abs(amount))

  if (obligationType === 'vip_palitada_collect') return normalized

  return -normalized

}

export function revolvingFundEntryTypeForVipObligation(

  obligationType: VipSettlementObligationType

): RevolvingFundEntryType {

  return obligationType === 'vip_palitada_collect' ? 'collection' : 'refund'

}



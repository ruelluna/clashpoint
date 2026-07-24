import { roundMatchMoney } from '@/features/matches/utils'
import type { PledgeSettlementResult } from '@/features/matches/pledge-settlement'
import type { FightResultType } from '@/features/results/types'

export type MatchSettlementObligationType =
  | 'monton_palitada_stake'
  | 'monton_palitada_payout'
  | 'monton_palitada_draw_refund'
  | 'monton_house_earnings'
  | 'vip_palitada_payout_info'

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

function didSideWin(resultType: FightResultType, side: 'meron' | 'wala'): boolean {
  if (resultType === 'meron_win') return side === 'meron'
  if (resultType === 'wala_win') return side === 'wala'
  return false
}

export function buildMatchSettlementObligations(
  settlement: PledgeSettlementResult,
  resultType: FightResultType
): MatchSettlementObligationDraft[] {
  const obligations: MatchSettlementObligationDraft[] = []
  let sortOrder = 0

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

        const winLine =
          contributor.winnings > 0
            ? `If ${side === 'meron' ? 'Meron' : 'Wala'} wins: pay ₱${contributor.winnings.toFixed(2)}`
            : `If ${side === 'meron' ? 'Meron' : 'Wala'} wins: no payout`
        const loseLine = `If ${side === 'meron' ? 'Meron' : 'Wala'} loses: VIP loses ₱${contributor.amount.toFixed(2)}`

        obligations.push({
          obligationKey: `vip_palitada:${contributorId}:info`,
          obligationType: 'vip_palitada_payout_info',
          amount: 0,
          label: `VIP Palitada — ${contributor.contributorName}`,
          description: `${winLine} · ${loseLine}${resultType === 'draw' ? ` · Draw refund ₱${contributor.drawNetRefund.toFixed(2)}` : ''}`,
          contributorId,
          requiresLedgerPost: false,
          sortOrder: sortOrder++,
        })
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
  obligations: Array<{ requires_ledger_post: boolean; status: 'pending' | 'posted' }>
): boolean {
  return obligations
    .filter((row) => row.requires_ledger_post)
    .every((row) => row.status === 'posted')
}

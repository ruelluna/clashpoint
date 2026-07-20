import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { getMatchById } from '@/features/matches/queries'
import {
  buildPledgeSettlementInput,
  calculatePledgeSettlement,
  type PledgeSettlementResult,
} from '@/features/matches/pledge-settlement'
import type { MatchListItem } from '@/features/matches/types'
import { persistMatchSettlementObligations } from '@/features/matches/match-settling-service'
import type { FightResultType } from '@/features/results/types'
import type { Json } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'

type EventSettlementConfig = {
  tax_commission: number
  tax_per_fight: number
}

export async function loadMatchSettlementContext(
  eventId: string,
  matchId: string
): Promise<{
  error?: string
  match?: MatchListItem
  event?: EventSettlementConfig
}> {
  const supabase = await createClient()
  const [match, eventResult] = await Promise.all([
    getMatchById(eventId, matchId),
    supabase
      .from('events')
      .select('tax_commission, tax_per_fight')
      .eq('id', eventId)
      .maybeSingle(),
  ])

  if (eventResult.error) return { error: eventResult.error.message }
  if (!match) return { error: 'Match not found for this event' }
  if (!eventResult.data) return { error: 'Event not found' }

  return {
    match,
    event: {
      tax_commission: Number(eventResult.data.tax_commission ?? 0),
      tax_per_fight: Number(eventResult.data.tax_per_fight ?? 0),
    },
  }
}

export async function applyMatchPledgeSettlement(
  actorId: string,
  eventId: string,
  matchId: string,
  resultType: FightResultType
): Promise<{ error?: string; settlement?: PledgeSettlementResult }> {
  const context = await loadMatchSettlementContext(eventId, matchId)
  if (context.error || !context.match || !context.event) {
    return { error: context.error ?? 'Match not found' }
  }

  const settlement = calculatePledgeSettlement(
    buildPledgeSettlementInput({
      match: context.match,
      commissionRatePercent: context.event.tax_commission,
      taxAmount: context.event.tax_per_fight,
    })
  )

  const supabase = await createClient()
  const snapshot = JSON.parse(JSON.stringify(settlement)) as Json

  const { error: matchError } = await supabase
    .from('matches')
    .update({
      in_meron_odds: settlement.meronOdds,
      in_wala_odds: settlement.walaOdds,
      pledge_settlement_snapshot: snapshot,
      updated_at: new Date().toISOString(),
    })
    .eq('id', matchId)
    .eq('event_id', eventId)

  if (matchError) return { error: matchError.message }

  const { error: settlementError } = await supabase.from('match_pledge_settlements').upsert(
    {
      match_id: matchId,
      event_id: eventId,
      result_type: resultType,
      total_winning_pool: settlement.totalWinningPool,
      in_meron_odds: settlement.meronOdds,
      in_wala_odds: settlement.walaOdds,
      snapshot,
      recorded_by: actorId,
    },
    { onConflict: 'match_id' }
  )

  if (settlementError) return { error: settlementError.message }

  const obligationResult = await persistMatchSettlementObligations(
    eventId,
    matchId,
    resultType
  )
  if (obligationResult.error) return { error: obligationResult.error }

  await writeAuditLog({
    actorId,
    action: 'match.pledge_settlement',
    entityType: 'match',
    entityId: matchId,
    newValues: {
      resultType,
      totalWinningPool: settlement.totalWinningPool,
      meronOdds: settlement.meronOdds,
      walaOdds: settlement.walaOdds,
    },
  })

  return { settlement }
}

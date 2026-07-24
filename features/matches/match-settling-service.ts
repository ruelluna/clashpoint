import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import {
  allRequiredObligationsPosted,
  buildMatchSettlementObligations,
  type MatchSettlementObligationType,
} from '@/features/matches/match-settlement-obligations'
import { loadMatchSettlementContext } from '@/features/matches/pledge-settlement-service'
import type {
  MatchSettlementObligationItem,
  SettlingMatchListItem,
} from '@/features/matches/types'
import type { RevolvingFundEntryType } from '@/features/revolving-fund/types'
import { postRevolvingFundLedgerEntry } from '@/features/revolving-fund/service'
import type { FightResultType } from '@/features/results/types'
import { createClient } from '@/lib/supabase/server'

type ObligationRow = {
  id: string
  match_id: string
  event_id: string
  obligation_key: string
  obligation_type: MatchSettlementObligationType
  amount: number
  label: string
  description: string | null
  contributor_id: string | null
  requires_ledger_post: boolean
  status: 'pending' | 'posted'
  ledger_entry_id: string | null
  sort_order: number
}

function mapObligationRow(row: ObligationRow): MatchSettlementObligationItem {
  return {
    id: row.id,
    match_id: row.match_id,
    event_id: row.event_id,
    obligation_key: row.obligation_key,
    obligation_type: row.obligation_type,
    amount: Number(row.amount),
    label: row.label,
    description: row.description,
    contributor_id: row.contributor_id,
    requires_ledger_post: row.requires_ledger_post,
    status: row.status,
    ledger_entry_id: row.ledger_entry_id,
    sort_order: row.sort_order,
  }
}

function ledgerEntryTypeForObligation(
  obligationType: MatchSettlementObligationType
): RevolvingFundEntryType {
  switch (obligationType) {
    case 'monton_palitada_stake':
      return 'adjustment'
    case 'monton_palitada_payout':
      return 'collection'
    case 'monton_palitada_draw_refund':
      return 'refund'
    case 'monton_house_earnings':
      return 'collection'
    default:
      return 'adjustment'
  }
}

export async function persistMatchSettlementObligations(
  eventId: string,
  matchId: string,
  resultType: FightResultType
): Promise<{ error?: string }> {
  const context = await loadMatchSettlementContext(eventId, matchId)
  if (context.error || !context.match || !context.event) {
    return { error: context.error ?? 'Match not found' }
  }

  const { calculatePledgeSettlement, buildPledgeSettlementInput } = await import(
    '@/features/matches/pledge-settlement'
  )

  const settlement = calculatePledgeSettlement(
    buildPledgeSettlementInput({
      match: context.match,
      commissionRatePercent: context.event.tax_commission,
      taxAmount: context.event.tax_per_fight,
    })
  )

  const drafts = buildMatchSettlementObligations(settlement, resultType)
  if (drafts.length === 0) return {}

  const supabase = await createClient()
  const { error } = await supabase.from('match_settlement_obligations').upsert(
    drafts.map((draft) => ({
      match_id: matchId,
      event_id: eventId,
      obligation_key: draft.obligationKey,
      obligation_type: draft.obligationType,
      amount: draft.amount,
      label: draft.label,
      description: draft.description,
      contributor_id: draft.contributorId,
      requires_ledger_post: draft.requiresLedgerPost,
      status: draft.requiresLedgerPost ? ('pending' as const) : ('posted' as const),
      sort_order: draft.sortOrder,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'match_id,obligation_key' }
  )

  if (error) return { error: error.message }
  return {}
}

export async function listSettlingMatchesWithObligations(
  eventId: string
): Promise<SettlingMatchListItem[]> {
  const supabase = await createClient()

  const { data: matchRows, error: matchError } = await supabase
    .from('matches')
    .select('id')
    .eq('event_id', eventId)
    .eq('status', 'settling')
    .order('fight_number', { ascending: true })

  if (matchError) throw matchError
  if (!matchRows?.length) return []

  const matchIds = matchRows.map((row) => row.id as string)

  const [{ data: obligations, error: obligationError }, { data: results, error: resultError }] =
    await Promise.all([
      supabase
        .from('match_settlement_obligations')
        .select('*')
        .in('match_id', matchIds)
        .order('sort_order', { ascending: true }),
      supabase.from('fight_results').select('match_id, result_type').in('match_id', matchIds),
    ])

  if (obligationError) throw obligationError
  if (resultError) throw resultError

  const resultByMatch = new Map(
    (results ?? []).map((row) => [row.match_id as string, row.result_type as FightResultType])
  )

  const obligationsByMatch = new Map<string, MatchSettlementObligationItem[]>()
  for (const row of (obligations ?? []) as ObligationRow[]) {
    const mapped = mapObligationRow(row)
    const existing = obligationsByMatch.get(mapped.match_id) ?? []
    existing.push(mapped)
    obligationsByMatch.set(mapped.match_id, existing)
  }

  const { getMatchById } = await import('@/features/matches/queries')
  const matches = await Promise.all(matchIds.map((matchId) => getMatchById(eventId, matchId)))

  return matches
    .filter((match): match is NonNullable<typeof match> => Boolean(match))
    .map((match) => ({
      ...match,
      result_type: resultByMatch.get(match.id) ?? 'draw',
      obligations: obligationsByMatch.get(match.id) ?? [],
    }))
}

export async function postMatchSettlementObligation(
  actorId: string,
  eventId: string,
  matchId: string,
  obligationId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: obligation, error: fetchError } = await supabase
    .from('match_settlement_obligations')
    .select('*')
    .eq('id', obligationId)
    .eq('match_id', matchId)
    .eq('event_id', eventId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!obligation) return { error: 'Settlement obligation not found' }

  const row = obligation as ObligationRow
  if (row.status === 'posted') return {}

  if (!row.requires_ledger_post) {
    const { error } = await supabase
      .from('match_settlement_obligations')
      .update({ status: 'posted', updated_at: new Date().toISOString() })
      .eq('id', obligationId)
    if (error) return { error: error.message }
    return {}
  }

  const amount = Number(row.amount)
  if (Math.abs(amount) < 0.005) {
    const { error } = await supabase
      .from('match_settlement_obligations')
      .update({ status: 'posted', updated_at: new Date().toISOString() })
      .eq('id', obligationId)
    if (error) return { error: error.message }
    return {}
  }

  const ledgerResult = await postRevolvingFundLedgerEntry({
    eventId,
    amount,
    entryType: ledgerEntryTypeForObligation(row.obligation_type),
    description: row.description ?? row.label,
    actorId,
    sourceMatchId: matchId,
    obligationKey: row.obligation_key,
  })

  if (ledgerResult.error) return { error: ledgerResult.error }
  if (!ledgerResult.ledgerEntryId) return { error: 'Failed to create ledger entry' }

  const { error: updateError } = await supabase
    .from('match_settlement_obligations')
    .update({
      status: 'posted',
      ledger_entry_id: ledgerResult.ledgerEntryId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', obligationId)

  if (updateError) return { error: updateError.message }

  await writeAuditLog({
    actorId,
    action: 'match.settlement_obligation_posted',
    entityType: 'match',
    entityId: matchId,
    newValues: {
      obligationId,
      obligationKey: row.obligation_key,
      amount,
      ledgerEntryId: ledgerResult.ledgerEntryId,
    },
  })

  return {}
}

export async function completeMatchSettlement(
  actorId: string,
  eventId: string,
  matchId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, status')
    .eq('id', matchId)
    .eq('event_id', eventId)
    .maybeSingle()

  if (matchError) return { error: matchError.message }
  if (!match) return { error: 'Match not found' }
  if (match.status !== 'settling') {
    return { error: 'Match is not awaiting settlement' }
  }

  const { data: obligations, error: obligationError } = await supabase
    .from('match_settlement_obligations')
    .select('requires_ledger_post, status')
    .eq('match_id', matchId)

  if (obligationError) return { error: obligationError.message }

  if (!allRequiredObligationsPosted((obligations ?? []) as ObligationRow[])) {
    return { error: 'Post all required revolving fund obligations before marking settled' }
  }

  const settledAt = new Date().toISOString()

  const { error: matchUpdateError } = await supabase
    .from('matches')
    .update({ status: 'completed', updated_at: settledAt })
    .eq('id', matchId)
    .eq('event_id', eventId)

  if (matchUpdateError) return { error: matchUpdateError.message }

  const { error: pledgeUpdateError } = await supabase
    .from('match_pledge_settlements')
    .update({ settled_at: settledAt, settled_by: actorId })
    .eq('match_id', matchId)

  if (pledgeUpdateError) return { error: pledgeUpdateError.message }

  await writeAuditLog({
    actorId,
    action: 'match.settlement_completed',
    entityType: 'match',
    entityId: matchId,
    newValues: { status: 'completed', settledAt },
  })

  return {}
}

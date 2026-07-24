'use client'

import { createClient } from '@/lib/supabase/client'
import type {
  MatchListItem,
  MatchSettlementObligationItem,
  SettlingMatchListItem,
} from '@/features/matches/types'
import {
  mapMatchListItemFromQueryRow,
  type ClientMatchQueryRow,
} from '@/features/matches/client-mapper'
import type { FightResultType } from '@/features/results/types'

type ObligationRow = {
  id: string
  match_id: string
  event_id: string
  obligation_key: string
  obligation_type: MatchSettlementObligationItem['obligation_type']
  amount: number
  label: string
  description: string | null
  contributor_id: string | null
  requires_ledger_post: boolean
  status: 'pending' | 'posted' | 'paid'
  ledger_entry_id: string | null
  paid_at: string | null
  paid_by: string | null
  payment_id: string | null
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
    paid_at: row.paid_at,
    paid_by: row.paid_by,
    payment_id: row.payment_id,
    sort_order: row.sort_order,
  }
}

export async function fetchMatchListItemClient(
  eventId: string,
  matchId: string
): Promise<MatchListItem | null> {
  const supabase = createClient()

  const { data: match, error } = await supabase
    .from('matches')
    .select(
      `
        id,
        event_id,
        fight_number,
        matching_number,
        round_number,
        status,
        queue_status,
        in_meron_odds,
        in_wala_odds,
        meron_entry_id,
        wala_entry_id,
        meron_rooster_id,
        wala_rooster_id,
        meron_weight,
        wala_weight,
        meron_entry:entries!matches_meron_entry_id_fkey (
          id,
          entry_number,
          entry_name,
          owner_name
        ),
        wala_entry:entries!matches_wala_entry_id_fkey (
          id,
          entry_number,
          entry_name,
          owner_name
        ),
        meron_rooster:rooster_event_registrations!matches_meron_rooster_id_fkey (
          id,
          cock_number,
          band_number
        ),
        wala_rooster:rooster_event_registrations!matches_wala_rooster_id_fkey (
          id,
          cock_number,
          band_number
        )
      `
    )
    .eq('event_id', eventId)
    .eq('id', matchId)
    .maybeSingle()

  if (error || !match) return null

  const [{ data: bets }, { data: palitada }] = await Promise.all([
    supabase.from('match_bets').select('*').eq('match_id', matchId),
    supabase.from('match_palitada_contributions').select('*').eq('match_id', matchId),
  ])

  return mapMatchListItemFromQueryRow(
    match as unknown as ClientMatchQueryRow,
    bets ?? [],
    palitada ?? []
  )
}

export async function fetchSettlingMatchClient(
  eventId: string,
  matchId: string
): Promise<SettlingMatchListItem | null> {
  const match = await fetchMatchListItemClient(eventId, matchId)
  if (!match) return null
  if (match.status !== 'settling') return null

  const supabase = createClient()
  const [{ data: obligations, error: obligationError }, { data: result, error: resultError }] =
    await Promise.all([
      supabase
        .from('match_settlement_obligations')
        .select('*')
        .eq('match_id', matchId)
        .order('sort_order', { ascending: true }),
      supabase
        .from('fight_results')
        .select('result_type')
        .eq('match_id', matchId)
        .maybeSingle(),
    ])

  if (obligationError || resultError) return null

  return {
    ...match,
    result_type: (result?.result_type ?? 'draw') as FightResultType,
    obligations: ((obligations ?? []) as ObligationRow[]).map(mapObligationRow),
  }
}

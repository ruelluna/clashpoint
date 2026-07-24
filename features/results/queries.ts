import 'server-only'

import {
  handlerContributorName,
  handlerObligationSideFromDescription,
  isHandlerSettlementObligationType,
  isVipSettlementObligationType,
  type MatchSettlementObligationType,
  vipObligationActionLabel,
} from '@/features/matches/match-settlement-obligations'
import type {
  MatchForResult,
  ResultHandlerSettlementItem,
  ResultListItem,
  ResultVipSettlementItem,
} from '@/features/results/types'
import { createClient } from '@/lib/supabase/server'

type ResultRow = {
  id: string
  match_id: string
  event_id: string
  winning_side: string | null
  result_type: string
  winning_entry_id: string | null
  losing_entry_id: string | null
  result_status: string
  recorded_by: string | null
  verified_by: string | null
  result_time: string | null
  notes: string | null
  under_protest: boolean
  created_at: string
  updated_at: string
  matches: {
    fight_number: number
    meron_entry_id: string
    wala_entry_id: string
    status: string
  } | null
}

type EntryNameRow = {
  id: string
  entry_name: string
}

type SettlementRow = {
  match_id: string
  settled_at: string | null
}

type ObligationRow = {
  match_id: string
  obligation_type: string
  amount: number
  label: string
  description: string | null
  status: 'pending' | 'posted' | 'paid'
  paid_at: string | null
  requires_ledger_post: boolean
}

function vipContributorName(label: string): string {
  const prefixes = ['Pay VIP — ', 'Collect from VIP — ', 'Refund VIP — ']
  for (const prefix of prefixes) {
    if (label.startsWith(prefix)) return label.slice(prefix.length)
  }
  return label
}

function mapVipSettlement(row: ObligationRow): ResultVipSettlementItem {
  const obligationType = row.obligation_type as MatchSettlementObligationType
  return {
    name: vipContributorName(row.label),
    action: vipObligationActionLabel(obligationType) as ResultVipSettlementItem['action'],
    amount: Number(row.amount),
    paid_at: row.paid_at,
    status: row.status,
  }
}

function parseHandlerWinBreakdown(description: string | null): {
  betAmount: number
  winnings: number
  totalPayout: number
} {
  const match = description?.match(
    /Bet ₱([\d,.]+) \+ won ₱([\d,.]+) · Pay ₱([\d,.]+) from revolving fund/
  ) ?? description?.match(
    /· Bet ₱([\d,.]+) \+ won ₱([\d,.]+) · Pay ₱([\d,.]+) from revolving fund/
  )
  if (!match) {
    return { betAmount: 0, winnings: 0, totalPayout: 0 }
  }

  const parseAmount = (value: string) => Number(value.replace(/,/g, ''))

  return {
    betAmount: parseAmount(match[1]),
    winnings: parseAmount(match[2]),
    totalPayout: parseAmount(match[3]),
  }
}

function mapHandlerSettlement(row: ObligationRow): ResultHandlerSettlementItem {
  const side = handlerObligationSideFromDescription(row.description)
  const name = handlerContributorName(row.label)
  const obligationType = row.obligation_type as MatchSettlementObligationType
  const resolvedSide: ResultHandlerSettlementItem['side'] =
    side === 'Meron' || side === 'Wala' ? side : 'Meron'

  if (obligationType === 'handler_draw_refund') {
    return {
      name,
      side: resolvedSide,
      betAmount: Number(row.amount),
      winnings: 0,
      totalPayout: Number(row.amount),
      paid_at: row.paid_at,
      status: row.status,
      kind: 'draw_refund',
    }
  }

  const breakdown = parseHandlerWinBreakdown(row.description)

  return {
    name,
    side: resolvedSide,
    betAmount: breakdown.betAmount,
    winnings: breakdown.winnings,
    totalPayout: breakdown.totalPayout || Number(row.amount),
    paid_at: row.paid_at,
    status: row.status,
    kind: 'win',
  }
}

export async function listResultsForEvent(
  eventId: string
): Promise<ResultListItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fight_results')
    .select(
      `
      id,
      match_id,
      event_id,
      winning_side,
      result_type,
      winning_entry_id,
      losing_entry_id,
      result_status,
      recorded_by,
      verified_by,
      result_time,
      notes,
      under_protest,
      created_at,
      updated_at,
      matches (
        fight_number,
        meron_entry_id,
        wala_entry_id,
        status
      )
    `
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows = (data ?? []) as unknown as ResultRow[]
  if (rows.length === 0) return []

  const matchIds = [...new Set(rows.map((row) => row.match_id))]

  const entryIds = [
    ...new Set(
      rows.flatMap((row) => [
        row.matches?.meron_entry_id,
        row.matches?.wala_entry_id,
      ])
    ),
  ].filter(Boolean) as string[]

  const [{ data: settlements, error: settlementsError }, { data: obligations, error: obligationsError }] =
    await Promise.all([
      supabase
        .from('match_pledge_settlements')
        .select('match_id, settled_at')
        .in('match_id', matchIds),
      supabase
        .from('match_settlement_obligations')
        .select(
          'match_id, obligation_type, amount, label, description, status, paid_at, requires_ledger_post'
        )
        .in('match_id', matchIds),
    ])

  if (settlementsError) throw settlementsError
  if (obligationsError) throw obligationsError

  const entryNameMap = new Map<string, string>()
  if (entryIds.length > 0) {
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('id, entry_name')
      .in('id', entryIds)

    if (entriesError) throw entriesError

    for (const entry of (entries ?? []) as EntryNameRow[]) {
      entryNameMap.set(entry.id, entry.entry_name)
    }
  }

  const settledAtByMatch = new Map(
    ((settlements ?? []) as SettlementRow[]).map((row) => [row.match_id, row.settled_at])
  )

  const obligationsByMatch = new Map<string, ObligationRow[]>()
  for (const row of (obligations ?? []) as ObligationRow[]) {
    const existing = obligationsByMatch.get(row.match_id) ?? []
    existing.push(row)
    obligationsByMatch.set(row.match_id, existing)
  }

  return rows.map((row) => {
    const matchObligations = obligationsByMatch.get(row.match_id) ?? []
    const vipSettlements = matchObligations
      .filter((obligation) => isVipSettlementObligationType(obligation.obligation_type))
      .map(mapVipSettlement)
    const handlerSettlements = matchObligations
      .filter((obligation) => isHandlerSettlementObligationType(obligation.obligation_type))
      .map(mapHandlerSettlement)
    const revolvingFundComplete = matchObligations
      .filter((obligation) => obligation.requires_ledger_post)
      .every((obligation) => obligation.status === 'posted')

    return {
      id: row.id,
      match_id: row.match_id,
      event_id: row.event_id,
      winning_side: row.winning_side as ResultListItem['winning_side'],
      result_type: row.result_type as ResultListItem['result_type'],
      winning_entry_id: row.winning_entry_id,
      losing_entry_id: row.losing_entry_id,
      result_status: row.result_status as ResultListItem['result_status'],
      recorded_by: row.recorded_by,
      verified_by: row.verified_by,
      result_time: row.result_time,
      notes: row.notes,
      under_protest: row.under_protest,
      created_at: row.created_at,
      updated_at: row.updated_at,
      fight_number: row.matches?.fight_number ?? 0,
      meron_entry_id: row.matches?.meron_entry_id ?? '',
      wala_entry_id: row.matches?.wala_entry_id ?? '',
      meron_entry_name:
        entryNameMap.get(row.matches?.meron_entry_id ?? '') ?? '—',
      wala_entry_name: entryNameMap.get(row.matches?.wala_entry_id ?? '') ?? '—',
      match_status: row.matches?.status ?? 'completed',
      settlement_completed_at: settledAtByMatch.get(row.match_id) ?? null,
      revolving_fund_complete: revolvingFundComplete,
      vip_settlements: vipSettlements,
      handler_settlements: handlerSettlements,
    }
  })
}

export async function listMatchesPendingResults(
  eventId: string
): Promise<MatchForResult[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('matches')
    .select('id, event_id, fight_number, meron_entry_id, wala_entry_id, status')
    .eq('event_id', eventId)
    .in('status', ['at_pit', 'fighting', 'completed'])
    .order('fight_number', { ascending: true })

  if (error) throw error

  const matches = (data ?? []) as MatchForResult[]
  if (matches.length === 0) return []

  const { data: existingResults, error: resultsError } = await supabase
    .from('fight_results')
    .select('match_id, result_status')
    .eq('event_id', eventId)

  if (resultsError) throw resultsError

  const verifiedMatchIds = new Set(
    ((existingResults ?? []) as Array<{ match_id: string; result_status: string }>)
      .filter(
        (row) =>
          row.result_status === 'verified' || row.result_status === 'final'
      )
      .map((row) => row.match_id)
  )

  return matches.filter((match) => !verifiedMatchIds.has(match.id))
}

export async function listVerifiedResultMatchIds(eventId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('fight_results')
    .select('match_id, result_status')
    .eq('event_id', eventId)

  if (error) throw error

  return ((data ?? []) as Array<{ match_id: string; result_status: string }>)
    .filter(
      (row) => row.result_status === 'verified' || row.result_status === 'final'
    )
    .map((row) => row.match_id)
}

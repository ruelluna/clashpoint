import 'server-only'

import type { FightResultType } from '@/features/results/types'
import type { EntryFightStats } from '@/features/standings/types'
import {
  POINTS_DRAW,
  POINTS_LOSS,
  POINTS_WIN,
  rankStandings,
} from '@/features/standings/utils'
import { createClient } from '@/lib/supabase/server'

type VerifiedResultRow = {
  id: string
  match_id: string
  result_type: FightResultType
  winning_entry_id: string | null
  losing_entry_id: string | null
}

type MatchRow = {
  id: string
  meron_entry_id: string
  wala_entry_id: string
}

function createEmptyStats(entryId: string): EntryFightStats {
  return {
    entryId,
    totalFights: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0,
  }
}

function applyOutcome(
  statsMap: Map<string, EntryFightStats>,
  entryId: string,
  outcome: 'win' | 'draw' | 'loss'
): void {
  const current = statsMap.get(entryId) ?? createEmptyStats(entryId)

  if (outcome === 'win') {
    current.wins += 1
    current.points += POINTS_WIN
  } else if (outcome === 'draw') {
    current.draws += 1
    current.points += POINTS_DRAW
  } else {
    current.losses += 1
    current.points += POINTS_LOSS
  }

  current.totalFights += 1
  statsMap.set(entryId, current)
}

function accumulateResult(
  statsMap: Map<string, EntryFightStats>,
  result: VerifiedResultRow,
  match: MatchRow
): void {
  switch (result.result_type) {
    case 'meron_win':
      applyOutcome(statsMap, match.meron_entry_id, 'win')
      applyOutcome(statsMap, match.wala_entry_id, 'loss')
      break
    case 'wala_win':
      applyOutcome(statsMap, match.wala_entry_id, 'win')
      applyOutcome(statsMap, match.meron_entry_id, 'loss')
      break
    case 'draw':
      applyOutcome(statsMap, match.meron_entry_id, 'draw')
      applyOutcome(statsMap, match.wala_entry_id, 'draw')
      break
    case 'disqualification':
      if (result.winning_entry_id) {
        applyOutcome(statsMap, result.winning_entry_id, 'win')
      }
      if (result.losing_entry_id) {
        applyOutcome(statsMap, result.losing_entry_id, 'loss')
      }
      break
    case 'no_contest':
    case 'cancelled':
      break
    default:
      break
  }
}

export async function computeStandings(
  eventId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: results, error: resultsError } = await supabase
    .from('fight_results')
    .select('id, match_id, result_type, winning_entry_id, losing_entry_id')
    .eq('event_id', eventId)
    .in('result_status', ['verified', 'final'])

  if (resultsError) return { error: resultsError.message }

  const verifiedResults = (results ?? []) as VerifiedResultRow[]
  const matchIds = [...new Set(verifiedResults.map((row) => row.match_id))]

  if (matchIds.length === 0) {
    const { error: clearError } = await supabase
      .from('standings')
      .delete()
      .eq('event_id', eventId)

    if (clearError) return { error: clearError.message }
    return {}
  }

  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id, meron_entry_id, wala_entry_id')
    .eq('event_id', eventId)
    .in('id', matchIds)

  if (matchesError) return { error: matchesError.message }

  const matchMap = new Map(
    ((matches ?? []) as MatchRow[]).map((match) => [match.id, match])
  )

  const statsMap = new Map<string, EntryFightStats>()

  for (const result of verifiedResults) {
    const match = matchMap.get(result.match_id)
    if (!match) continue
    accumulateResult(statsMap, result, match)
  }

  const ranked = rankStandings([...statsMap.values()])
  const now = new Date().toISOString()

  const { error: clearError } = await supabase
    .from('standings')
    .delete()
    .eq('event_id', eventId)

  if (clearError) return { error: clearError.message }

  if (ranked.length === 0) return {}

  const rows = ranked.map((row) => ({
    event_id: eventId,
    entry_id: row.entryId,
    total_fights: row.totalFights,
    wins: row.wins,
    losses: row.losses,
    draws: row.draws,
    points: row.points,
    rank: row.rank,
    status: 'active' as const,
    updated_at: now,
  }))

  const { error: insertError } = await supabase.from('standings').insert(rows)

  if (insertError) return { error: insertError.message }

  return {}
}

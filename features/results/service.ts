import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import type { RecordResultInput, VerifyResultInput } from '@/features/results/schema'
import type { FightResultType, FightSide } from '@/features/results/types'
import { computeStandings } from '@/features/standings/service'
import { createClient } from '@/lib/supabase/server'

type MatchEntries = {
  id: string
  event_id: string
  meron_entry_id: string
  wala_entry_id: string
  status: string
}

function resolveEntries(
  resultType: FightResultType,
  match: MatchEntries
): {
  winningSide: FightSide | null
  winningEntryId: string | null
  losingEntryId: string | null
} {
  switch (resultType) {
    case 'meron_win':
      return {
        winningSide: 'meron',
        winningEntryId: match.meron_entry_id,
        losingEntryId: match.wala_entry_id,
      }
    case 'wala_win':
      return {
        winningSide: 'wala',
        winningEntryId: match.wala_entry_id,
        losingEntryId: match.meron_entry_id,
      }
    case 'draw':
      return {
        winningSide: null,
        winningEntryId: null,
        losingEntryId: null,
      }
    case 'disqualification':
      return {
        winningSide: null,
        winningEntryId: null,
        losingEntryId: null,
      }
    case 'no_contest':
    case 'cancelled':
      return {
        winningSide: null,
        winningEntryId: null,
        losingEntryId: null,
      }
    default:
      return {
        winningSide: null,
        winningEntryId: null,
        losingEntryId: null,
      }
  }
}

export async function recordResult(
  actorId: string,
  input: RecordResultInput
): Promise<{ error?: string; resultId?: string }> {
  const supabase = await createClient()

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, event_id, meron_entry_id, wala_entry_id, status')
    .eq('id', input.matchId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (matchError) return { error: matchError.message }
  if (!match) return { error: 'Match not found for this event' }

  const matchRow = match as MatchEntries
  if (['cancelled'].includes(matchRow.status)) {
    return { error: 'Cannot record a result for a cancelled match' }
  }

  const entries = resolveEntries(input.resultType, matchRow)

  const payload = {
    match_id: input.matchId,
    event_id: input.eventId,
    result_type: input.resultType,
    winning_side: entries.winningSide,
    winning_entry_id: entries.winningEntryId,
    losing_entry_id: entries.losingEntryId,
    result_status: 'submitted' as const,
    recorded_by: actorId,
    result_time: new Date().toISOString(),
    notes: input.notes ?? null,
    under_protest: input.underProtest ?? false,
    updated_at: new Date().toISOString(),
  }

  const { data: existing } = await supabase
    .from('fight_results')
    .select('id, result_status')
    .eq('match_id', input.matchId)
    .maybeSingle()

  const existingRow = existing as { id: string; result_status: string } | null

  if (existingRow?.result_status === 'verified' || existingRow?.result_status === 'final') {
    return { error: 'Verified results cannot be changed' }
  }

  const { data, error } = existingRow
    ? await supabase
        .from('fight_results')
        .update(payload)
        .eq('id', existingRow.id)
        .select('id')
        .single()
    : await supabase
        .from('fight_results')
        .insert(payload)
        .select('id')
        .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to record result' }
  }

  await supabase
    .from('matches')
    .update({
      status: 'completed',
      queue_status: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.matchId)

  await writeAuditLog({
    actorId,
    action: existingRow ? 'result.updated' : 'result.recorded',
    entityType: 'fight_result',
    entityId: data.id,
    newValues: {
      matchId: input.matchId,
      eventId: input.eventId,
      resultType: input.resultType,
      resultStatus: 'submitted',
    },
  })

  return { resultId: data.id }
}

export async function verifyResult(
  actorId: string,
  input: VerifyResultInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('fight_results')
    .select('id, event_id, match_id, result_type, result_status')
    .eq('id', input.resultId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Result not found' }

  const result = existing as {
    id: string
    event_id: string
    match_id: string
    result_type: FightResultType
    result_status: string
  }

  if (result.result_status === 'verified' || result.result_status === 'final') {
    return { error: 'Result is already verified' }
  }

  if (result.result_status === 'draft') {
    return { error: 'Result must be submitted before verification' }
  }

  const { error: updateError } = await supabase
    .from('fight_results')
    .update({
      result_status: 'verified',
      verified_by: actorId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.resultId)

  if (updateError) return { error: updateError.message }

  const standingsResult = await computeStandings(input.eventId)
  if (standingsResult.error) return { error: standingsResult.error }

  await writeAuditLog({
    actorId,
    action: 'result.verified',
    entityType: 'fight_result',
    entityId: input.resultId,
    oldValues: { resultStatus: result.result_status },
    newValues: {
      resultStatus: 'verified',
      matchId: result.match_id,
      resultType: result.result_type,
    },
  })

  return {}
}

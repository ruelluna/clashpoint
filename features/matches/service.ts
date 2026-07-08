import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import type {
  CreateMatchInput,
  LockMatchListInput,
  UpdateFightQueueStatusInput,
} from '@/features/matches/schema'
import type {
  FightQueueStatus,
  MatchStatus,
  RoosterEligibilityContext,
} from '@/features/matches/types'
import {
  canLockMatchList,
  collectUsedRoosterIds,
  isValidFightQueueTransition,
  matchStatusForQueueStatus,
  validateCockUsedOnce,
  validateNoSelfMatch,
  validateRoosterEligibility,
} from '@/features/matches/utils'
import type { Database } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'

type MatchUpdate = Database['public']['Tables']['matches']['Update']

type RoosterRow = {
  id: string
  entry_id: string
  event_id: string
  status: string
  weighings: { weight_status: string; official_weight: number | null } | null
}

const MATCHING_EVENT_STATUSES = ['ready_for_matching', 'ongoing']

async function fetchRoosterContext(
  roosterId: string,
  eventId: string
): Promise<{ error?: string; context?: RoosterEligibilityContext & { official_weight: number | null; entry_id: string } }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rooster_records')
    .select('id, entry_id, event_id, status, weighings ( weight_status, official_weight )')
    .eq('id', roosterId)
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Rooster not found for this event' }

  const row = data as unknown as RoosterRow
  const weighing = row.weighings

  return {
    context: {
      rooster_id: row.id,
      entry_id: row.entry_id,
      event_id: row.event_id,
      lineup_status: row.status,
      weight_status: weighing?.weight_status ?? null,
      official_weight: weighing?.official_weight ?? null,
    },
  }
}

export async function createMatch(
  actorId: string,
  input: CreateMatchInput
): Promise<{ error?: string; matchId?: string }> {
  const selfMatchError = validateNoSelfMatch(input.meronRoosterId, input.walaRoosterId)
  if (selfMatchError) return { error: selfMatchError }

  const supabase = await createClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, status, name')
    .eq('id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (eventError) return { error: eventError.message }
  if (!event) return { error: 'Event not found' }
  if (!MATCHING_EVENT_STATUSES.includes(event.status as string)) {
    return { error: 'Event is not open for matching' }
  }

  const [meronResult, walaResult] = await Promise.all([
    fetchRoosterContext(input.meronRoosterId, input.eventId),
    fetchRoosterContext(input.walaRoosterId, input.eventId),
  ])

  if (meronResult.error) return { error: `Meron: ${meronResult.error}` }
  if (walaResult.error) return { error: `Wala: ${walaResult.error}` }

  const meron = meronResult.context!
  const wala = walaResult.context!

  if (meron.entry_id !== input.meronEntryId) {
    return { error: 'Meron rooster does not belong to the selected entry' }
  }
  if (wala.entry_id !== input.walaEntryId) {
    return { error: 'Wala rooster does not belong to the selected entry' }
  }

  const meronEligibilityError = validateRoosterEligibility(meron)
  if (meronEligibilityError) return { error: `Meron: ${meronEligibilityError}` }

  const walaEligibilityError = validateRoosterEligibility(wala)
  if (walaEligibilityError) return { error: `Wala: ${walaEligibilityError}` }

  const { data: existingMatches, error: matchesError } = await supabase
    .from('matches')
    .select('meron_rooster_id, wala_rooster_id, status, fight_number')
    .eq('event_id', input.eventId)

  if (matchesError) return { error: matchesError.message }

  const usedRoosterIds = collectUsedRoosterIds(
    (existingMatches ?? []) as Array<{
      meron_rooster_id: string
      wala_rooster_id: string
      status: MatchStatus
    }>
  )

  const meronUsedError = validateCockUsedOnce(input.meronRoosterId, usedRoosterIds)
  if (meronUsedError) return { error: meronUsedError }

  const walaUsedError = validateCockUsedOnce(input.walaRoosterId, usedRoosterIds)
  if (walaUsedError) return { error: walaUsedError }

  let fightNumber = input.fightNumber
  if (fightNumber == null) {
    const numbers = (existingMatches ?? []).map((match) => Number(match.fight_number))
    fightNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
  } else {
    const duplicate = (existingMatches ?? []).some(
      (match) => Number(match.fight_number) === fightNumber
    )
    if (duplicate) return { error: `Fight number ${fightNumber} is already used` }
  }

  const { data: match, error: insertError } = await supabase
    .from('matches')
    .insert({
      event_id: input.eventId,
      fight_number: fightNumber,
      round_number: input.roundNumber ?? 1,
      meron_entry_id: input.meronEntryId,
      meron_rooster_id: input.meronRoosterId,
      meron_weight: meron.official_weight,
      wala_entry_id: input.walaEntryId,
      wala_rooster_id: input.walaRoosterId,
      wala_weight: wala.official_weight,
      status: 'draft',
      created_by: actorId,
    })
    .select('id')
    .single()

  if (insertError || !match) {
    return { error: insertError?.message ?? 'Failed to create match' }
  }

  await writeAuditLog({
    actorId,
    action: 'match.created',
    entityType: 'match',
    entityId: match.id,
    newValues: {
      eventId: input.eventId,
      fightNumber,
      meronRoosterId: input.meronRoosterId,
      walaRoosterId: input.walaRoosterId,
      eventName: event.name,
    },
  })

  return { matchId: match.id }
}

export async function lockMatchList(
  actorId: string,
  input: LockMatchListInput
): Promise<{ error?: string; lockedCount?: number }> {
  const supabase = await createClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, status, name')
    .eq('id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (eventError) return { error: eventError.message }
  if (!event) return { error: 'Event not found' }
  if (!MATCHING_EVENT_STATUSES.includes(event.status as string)) {
    return { error: 'Event is not ready to lock matches' }
  }

  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('id, status')
    .eq('event_id', input.eventId)

  if (matchesError) return { error: matchesError.message }

  const statuses = (matches ?? []).map((match) => match.status as MatchStatus)
  const lockError = canLockMatchList(statuses)
  if (lockError) return { error: lockError }

  const { error: updateError } = await supabase
    .from('matches')
    .update({
      status: 'locked',
      queue_status: 'scheduled',
    })
    .eq('event_id', input.eventId)
    .in('status', ['draft', 'for_review', 'confirmed'])

  if (updateError) return { error: updateError.message }

  await writeAuditLog({
    actorId,
    action: 'match.list_locked',
    entityType: 'event',
    entityId: input.eventId,
    newValues: {
      lockedCount: matches?.length ?? 0,
      eventName: event.name,
    },
  })

  return { lockedCount: matches?.length ?? 0 }
}

export async function updateFightQueueStatus(
  actorId: string,
  input: UpdateFightQueueStatusInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: match, error: fetchError } = await supabase
    .from('matches')
    .select('id, event_id, fight_number, status, queue_status')
    .eq('id', input.matchId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!match) return { error: 'Match not found' }

  const currentQueue = (match.queue_status as string | null) ?? null
  if (
    !isValidFightQueueTransition(
      currentQueue as FightQueueStatus | null,
      input.queueStatus
    )
  ) {
    return {
      error: `Cannot move fight #${match.fight_number} from ${currentQueue ?? 'unset'} to ${input.queueStatus}`,
    }
  }

  if (!['locked', 'ready', 'ongoing'].includes(match.status as string) && input.queueStatus !== 'scheduled') {
    return { error: 'Match must be locked before advancing the fight queue' }
  }

  const nextMatchStatus = matchStatusForQueueStatus(input.queueStatus)
  const payload: MatchUpdate = {
    queue_status: input.queueStatus,
  }
  if (nextMatchStatus) {
    payload.status = nextMatchStatus
  }

  const { error: updateError } = await supabase
    .from('matches')
    .update(payload)
    .eq('id', input.matchId)

  if (updateError) return { error: updateError.message }

  await writeAuditLog({
    actorId,
    action: 'match.queue_status_changed',
    entityType: 'match',
    entityId: input.matchId,
    oldValues: {
      queueStatus: currentQueue,
      status: match.status,
    },
    newValues: {
      queueStatus: input.queueStatus,
      status: nextMatchStatus ?? match.status,
      fightNumber: match.fight_number,
      eventId: match.event_id,
    },
  })

  return {}
}

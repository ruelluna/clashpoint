import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { evaluateMatchCompatibility } from '@/features/compatibility/service'
import { isRoosterRegistrationMatchable } from '@/features/compatibility/matchability'
import type {
  CancelMatchInput,
  CreateMatchInput,
  LockMatchListInput,
  LookupRoosterForMatchingInput,
  UpdateFightQueueStatusInput,
} from '@/features/matches/schema'
import { formatMatchBetBarcode } from '@/features/matches/schema'
import { tryPromoteMatchToQueue } from '@/features/matches/promotion'
import type {
  EligibleRooster,
  FightQueueStatus,
  MatchBetPaymentStatus,
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
import type { ConditionallyApprovedMatchHandling } from '@/lib/derby/enums'
import { normalizeCockEntryBarcodeInput } from '@/features/entries/schema'
import { createClient } from '@/lib/supabase/server'

type MatchBetInsert = Database['public']['Tables']['match_bets']['Insert']

type MatchUpdate = Database['public']['Tables']['matches']['Update']

type RoosterRow = {
  id: string
  entry_id: string
  event_id: string
  status: string
  category: string | null
  cock_entry_barcode: string | null
  registration_status: string
  approval_status: string
  eligibility_status: string
  inspection_status: string
  reg_payment_status: string
  weight_verified: boolean | null
  cock_number: number
  band_number: string
  entries: { entry_number: string; entry_name: string } | null
  weighings: { weight_status: string; official_weight: number | null } | null
}

const MATCHING_EVENT_STATUSES = ['in_progress']

async function fetchRoosterContext(
  roosterId: string,
  eventId: string
): Promise<{ error?: string; context?: RoosterEligibilityContext & { official_weight: number | null; entry_id: string } }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rooster_event_registrations')
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

async function upsertMatchBets(
  actorId: string,
  matchId: string,
  eventId: string,
  fightNumber: number,
  meronBet: number,
  walaBet: number
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const rows: MatchBetInsert[] = [
    {
      match_id: matchId,
      event_id: eventId,
      side: 'meron',
      amount: meronBet,
      barcode: formatMatchBetBarcode(eventId, fightNumber, 'meron'),
      payment_status: 'unpaid',
      recorded_by: actorId,
    },
    {
      match_id: matchId,
      event_id: eventId,
      side: 'wala',
      amount: walaBet,
      barcode: formatMatchBetBarcode(eventId, fightNumber, 'wala'),
      payment_status: 'unpaid',
      recorded_by: actorId,
    },
  ]

  for (const row of rows) {
    const { error } = await supabase.from('match_bets').upsert(row, {
      onConflict: 'match_id,side',
    })
    if (error) return { error: error.message }
  }

  return {}
}

async function markRoostersMatched(
  meronRoosterId: string,
  walaRoosterId: string
): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('rooster_event_registrations')
    .update({ registration_status: 'matched' })
    .in('id', [meronRoosterId, walaRoosterId])
}

export async function lookupEligibleRoosterByBarcode(
  input: LookupRoosterForMatchingInput
): Promise<{ error?: string; rooster?: EligibleRooster }> {
  const supabase = await createClient()
  const barcode = normalizeCockEntryBarcodeInput(input.barcode)

  const { data: row, error } = await supabase
    .from('rooster_event_registrations')
    .select(
      `
        id,
        entry_id,
        cock_number,
        band_number,
        category,
        status,
        category,
        cock_entry_barcode,
        registration_status,
        approval_status,
        eligibility_status,
        inspection_status,
        reg_payment_status,
        weight_verified,
        entries ( entry_number, entry_name ),
        weighings ( official_weight, weight_status )
      `
    )
    .eq('event_id', input.eventId)
    .eq('cock_entry_barcode', barcode)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!row) return { error: `No rooster found for barcode ${barcode}` }

  const rooster = row as unknown as RoosterRow

  const [{ data: event }, { data: policy }, { data: matches }] = await Promise.all([
    supabase
      .from('events')
      .select(
        'weight_verification_required, physical_inspection_required, conditionally_approved_match_handling'
      )
      .eq('id', input.eventId)
      .maybeSingle(),
    supabase
      .from('derby_eligibility_policies')
      .select('physical_inspection_required, entry_fee_payment_required')
      .eq('event_id', input.eventId)
      .maybeSingle(),
    supabase
      .from('matches')
      .select('meron_rooster_id, wala_rooster_id, status')
      .eq('event_id', input.eventId),
  ])

  const usedIds = collectUsedRoosterIds(
    (matches ?? []) as Array<{
      meron_rooster_id: string
      wala_rooster_id: string
      status: MatchStatus
    }>
  )

  if (usedIds.has(rooster.id)) {
    return { error: 'This rooster is already assigned to a match' }
  }

  const eventRow = event as {
    weight_verification_required?: boolean | null
    physical_inspection_required?: boolean | null
    conditionally_approved_match_handling?: ConditionallyApprovedMatchHandling | null
  } | null
  const policyRow = policy as {
    physical_inspection_required?: boolean | null
    entry_fee_payment_required?: boolean | null
  } | null

  const matchability = isRoosterRegistrationMatchable({
    registrationStatus: rooster.registration_status as never,
    approvalStatus: rooster.approval_status,
    eligibilityStatus: rooster.eligibility_status,
    weightVerified: Boolean(rooster.weight_verified),
    weightVerificationRequired: Boolean(eventRow?.weight_verification_required),
    inspectionStatus: rooster.inspection_status,
    physicalInspectionRequired: Boolean(
      eventRow?.physical_inspection_required || policyRow?.physical_inspection_required
    ),
    regPaymentStatus: rooster.reg_payment_status,
    entryFeePaymentRequired: Boolean(policyRow?.entry_fee_payment_required),
    conditionallyApprovedMatchHandling:
      eventRow?.conditionally_approved_match_handling ?? 'exclude',
  })

  if (!matchability.matchable) {
    return { error: matchability.reasons[0] ?? 'Rooster is not eligible for matching' }
  }

  if (rooster.status !== 'verified') {
    return { error: 'Rooster lineup must be verified before matching' }
  }

  if ((rooster.weighings?.weight_status ?? null) !== 'passed') {
    return { error: 'Rooster must pass weighing before matching' }
  }

  return {
    rooster: {
      rooster_id: rooster.id,
      entry_id: rooster.entry_id,
      entry_number: rooster.entries?.entry_number ?? '—',
      entry_name: rooster.entries?.entry_name ?? '—',
      cock_number: Number(rooster.cock_number),
      band_number: rooster.band_number,
      cock_entry_barcode: rooster.cock_entry_barcode,
      official_weight:
        rooster.weighings?.official_weight != null
          ? Number(rooster.weighings.official_weight)
          : null,
      category: rooster.category,
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

  const compatibility = await evaluateMatchCompatibility(
    input.eventId,
    input.meronRoosterId,
    input.walaRoosterId
  )

  if (compatibility.status === 'prohibited') {
    await writeAuditLog({
      actorId,
      action: 'match.prohibited_attempt',
      entityType: 'match',
      entityId: input.eventId,
      newValues: {
        meron_rooster_id: input.meronRoosterId,
        wala_rooster_id: input.walaRoosterId,
        reasons: compatibility.reasons,
      },
    })
    return { error: compatibility.reasons[0] ?? 'Matchup is prohibited' }
  }

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
      meronBet: input.meronBet,
      walaBet: input.walaBet,
    },
  })

  const betResult = await upsertMatchBets(
    actorId,
    match.id,
    input.eventId,
    fightNumber,
    input.meronBet,
    input.walaBet
  )
  if (betResult.error) return { error: betResult.error }

  await markRoostersMatched(input.meronRoosterId, input.walaRoosterId)

  return { matchId: match.id }
}

export async function cancelUnpaidMatch(
  actorId: string,
  input: CancelMatchInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: match, error: fetchError } = await supabase
    .from('matches')
    .select(
      'id, event_id, fight_number, status, queue_status, meron_rooster_id, wala_rooster_id'
    )
    .eq('id', input.matchId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!match) return { error: 'Match not found' }
  if (match.status === 'cancelled') return { error: 'Match is already cancelled' }
  if (match.queue_status != null) {
    return { error: 'Cannot cancel a match that is already in the fight queue' }
  }

  const { data: bets, error: betsError } = await supabase
    .from('match_bets')
    .select('payment_status')
    .eq('match_id', input.matchId)

  if (betsError) return { error: betsError.message }

  const hasPaidBet = (bets ?? []).some((bet) => bet.payment_status === 'paid')
  if (hasPaidBet) {
    return { error: 'Cannot cancel a match after a palitada payment has been recorded' }
  }

  const { error: updateError } = await supabase
    .from('matches')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.matchId)

  if (updateError) return { error: updateError.message }

  await supabase
    .from('rooster_event_registrations')
    .update({ registration_status: 'approved' })
    .in('id', [match.meron_rooster_id, match.wala_rooster_id])

  await writeAuditLog({
    actorId,
    action: 'match.cancelled',
    entityType: 'match',
    entityId: input.matchId,
    newValues: {
      fightNumber: match.fight_number,
      eventId: input.eventId,
    },
  })

  return {}
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

export { tryPromoteMatchToQueue, promoteMatchesForEntry } from '@/features/matches/promotion'

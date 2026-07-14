import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import {
  computeFeeAdjustmentLines,
  eventFeeSettingsFromRow,
  snapshotFromSettings,
  summarizeFeeAdjustments,
  type EntryFeeSnapshot,
  type EventFeeSettings,
} from '@/features/events/fee-utils'
import type {
  CreateEventInput,
  TransitionStatusInput,
  UpdateEventInput,
  UpdatePrizeStructureInput,
} from '@/features/events/schema'
import type { EventRow } from '@/features/events/types'
import {
  canEditEventDetails,
  isValidStatusTransition,
  resolveCocksPerEntry,
} from '@/features/events/utils'
import { getSystemSettings } from '@/features/settings/queries'
import type { Json } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'

async function toEventInsert(input: CreateEventInput | UpdateEventInput) {
  const settings = await getSystemSettings()
  const isClassic = input.eventType === 'classic'
  const isDerby = input.eventType === 'derby'

  const registrationFeeEnabled = isDerby ? input.registrationFeeEnabled : false
  const registrationFeeAmount = isDerby ? input.registrationFeeAmount : 0
  const roosterEntryFeeEnabled = isDerby ? input.roosterEntryFeeEnabled : false
  const roosterEntryFeeAmount = isDerby ? input.roosterEntryFeeAmount : 0
  const cashBondEnabled = isDerby ? input.cashBondEnabled : false
  const cashBondAmount = isDerby ? input.cashBondAmount : 0

  return {
    promoter_id: isClassic ? null : (input.promoterId ?? null),
    name: input.name,
    venue: settings.defaultVenue,
    event_date: input.eventDate,
    registration_deadline: isClassic ? null : (input.registrationDeadline ?? null),
    event_type: input.eventType,
    derby_format: isClassic ? null : (input.derbyFormat ?? input.derbyType ?? null),
    derby_type: isClassic ? null : (input.derbyAgeType ?? 'open_derby'),
    require_rooster_entry_approval: !isClassic,
    eligibility_enforcement_enabled: false,
    classification_matching_enabled: false,
    entry_fee: registrationFeeEnabled ? registrationFeeAmount : 0,
    registration_fee_enabled: registrationFeeEnabled,
    registration_fee_amount: registrationFeeAmount,
    rooster_entry_fee_enabled: roosterEntryFeeEnabled,
    rooster_entry_fee_amount: roosterEntryFeeAmount,
    cash_bond_enabled: cashBondEnabled,
    cash_bond_amount: cashBondAmount,
    tax_per_fight: input.taxPerFight,
    min_entries: null,
    max_entries: null,
    cocks_per_entry: resolveCocksPerEntry(
      input.eventType,
      input.derbyFormat ?? input.derbyType,
      input.cocksPerEntry
    ),
    min_weight: null,
    max_weight: null,
    scoring_system: 'points' as const,
    draw_rule: '0.5 points',
    tie_breaker_rule: 'shared_championship',
    guaranteed_prize_amount: null,
    house_deduction: 0,
    venue_share: 0,
    registration_rules: isClassic ? null : (input.registrationRules ?? null),
    legal_authorized: input.legalAuthorized,
    is_public: input.isPublic,
    publish_matches: input.publishMatches,
    publish_standings: input.publishStandings,
    publish_winners: input.publishWinners,
    publish_prize_amounts: input.publishPrizeAmounts,
    notes: input.notes ?? null,
  }
}

export async function createEvent(
  actorId: string,
  input: CreateEventInput
): Promise<{ error?: string; eventId?: string }> {
  const supabase = await createClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      ...(await toEventInsert(input)),
      status: 'draft',
      created_by: actorId,
    })
    .select('id')
    .single()

  if (eventError || !event) {
    return { error: eventError?.message ?? 'Failed to create event' }
  }

  if (input.prizeStructure) {
    const { error: prizeError } = await supabase.from('prize_structures').insert({
      event_id: event.id,
      prize_type: input.prizeStructure.prizeType,
      config: input.prizeStructure.config as Json,
    })

    if (prizeError) {
      await supabase.from('events').delete().eq('id', event.id)
      return { error: prizeError.message }
    }
  }

  await writeAuditLog({
    actorId,
    action: 'event.created',
    entityType: 'event',
    entityId: event.id,
    newValues: {
      name: input.name,
      status: 'draft',
      eventType: input.eventType,
      prizeType: input.prizeStructure?.prizeType ?? null,
    },
  })

  return { eventId: event.id }
}

function settingsFromInput(input: CreateEventInput | UpdateEventInput): EventFeeSettings {
  return snapshotFromSettings({
    registrationFeeEnabled: input.registrationFeeEnabled,
    registrationFeeAmount: input.registrationFeeAmount,
    roosterEntryFeeEnabled: input.roosterEntryFeeEnabled,
    roosterEntryFeeAmount: input.roosterEntryFeeAmount,
    cashBondEnabled: input.cashBondEnabled,
    cashBondAmount: input.cashBondAmount,
  })
}

async function recordFeeAdjustmentsIfNeeded(
  actorId: string,
  eventId: string,
  previousSettings: EventFeeSettings,
  newSettings: EventFeeSettings
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('entry_id, amount_paid, payment_status')
    .eq('event_id', eventId)
    .gt('amount_paid', 0)
    .neq('payment_status', 'refunded')

  if (paymentsError) return { error: paymentsError.message }
  if (!payments || payments.length === 0) return {}

  const amountPaidByEntry = new Map<string, number>()
  for (const row of payments) {
    const entryId = row.entry_id as string
    const paid = Number(row.amount_paid)
    amountPaidByEntry.set(entryId, (amountPaidByEntry.get(entryId) ?? 0) + paid)
  }

  const entryIds = [...amountPaidByEntry.keys()]
  if (entryIds.length === 0) return {}

  const { data: entries, error: entriesError } = await supabase
    .from('entries')
    .select('id, fee_snapshot')
    .eq('event_id', eventId)
    .in('id', entryIds)
    .is('deleted_at', null)

  if (entriesError) return { error: entriesError.message }

  const { data: roosterCounts, error: roosterError } = await supabase
    .from('rooster_event_registrations')
    .select('entry_id')
    .eq('event_id', eventId)
    .in('entry_id', entryIds)

  if (roosterError) return { error: roosterError.message }

  const countByEntry = new Map<string, number>()
  for (const row of roosterCounts ?? []) {
    const entryId = row.entry_id as string
    countByEntry.set(entryId, (countByEntry.get(entryId) ?? 0) + 1)
  }

  const lines = computeFeeAdjustmentLines(
    (entries ?? []).map((entry) => ({
      id: entry.id as string,
      feeSnapshot: (entry.fee_snapshot as EntryFeeSnapshot | null) ?? null,
      roosterCount: countByEntry.get(entry.id as string) ?? 0,
    })),
    previousSettings,
    newSettings,
    amountPaidByEntry
  )

  if (lines.length === 0) return {}

  const summary = summarizeFeeAdjustments(lines)

  const { data: adjustment, error: adjustmentError } = await supabase
    .from('event_fee_adjustments')
    .insert({
      event_id: eventId,
      changed_by: actorId,
      previous_settings: previousSettings as unknown as Json,
      new_settings: newSettings as unknown as Json,
      entries_with_payments_count: summary.entriesWithPaymentsCount,
      total_refund_due: summary.totalRefundDue,
      total_collect_due: summary.totalCollectDue,
    })
    .select('id')
    .single()

  if (adjustmentError || !adjustment) {
    return { error: adjustmentError?.message ?? 'Failed to record fee adjustment' }
  }

  const { error: linesError } = await supabase.from('entry_fee_adjustment_lines').insert(
    lines.map((line) => ({
      adjustment_id: adjustment.id,
      entry_id: line.entryId,
      previous_amount_due: line.previousAmountDue,
      new_amount_due: line.newAmountDue,
      amount_paid: line.amountPaid,
      delta: line.delta,
    }))
  )

  if (linesError) return { error: linesError.message }

  return {}
}

export async function updateEvent(
  actorId: string,
  input: UpdateEventInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Event not found' }
  if (!canEditEventDetails(existing.status as EventRow['status'])) {
    return { error: 'Event details cannot be edited in the current status' }
  }

  const previousSettings = eventFeeSettingsFromRow(existing)
  const newSettings = settingsFromInput(input)

  const { error } = await supabase
    .from('events')
    .update(await toEventInsert(input))
    .eq('id', input.eventId)

  if (error) return { error: error.message }

  const adjustmentResult = await recordFeeAdjustmentsIfNeeded(
    actorId,
    input.eventId,
    previousSettings,
    newSettings
  )
  if (adjustmentResult.error) return adjustmentResult

  if (input.prizeStructure) {
    const { data: existingPrize } = await supabase
      .from('prize_structures')
      .select('id')
      .eq('event_id', input.eventId)
      .maybeSingle()

    const payload = {
      prize_type: input.prizeStructure.prizeType,
      config: input.prizeStructure.config as Json,
    }

    const { error: prizeError } = existingPrize
      ? await supabase.from('prize_structures').update(payload).eq('event_id', input.eventId)
      : await supabase.from('prize_structures').insert({ event_id: input.eventId, ...payload })

    if (prizeError) return { error: prizeError.message }
  }

  await writeAuditLog({
    actorId,
    action: 'event.updated',
    entityType: 'event',
    entityId: input.eventId,
    oldValues: { name: existing.name as string, status: existing.status },
    newValues: { name: input.name },
  })

  return {}
}

export async function transitionStatus(
  actorId: string,
  input: TransitionStatusInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('events')
    .select('status, name, legal_authorized')
    .eq('id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Event not found' }

  const currentStatus = existing.status as EventRow['status']
  const nextStatus = input.status

  if (!isValidStatusTransition(currentStatus, nextStatus)) {
    return {
      error: `Cannot transition from ${currentStatus} to ${nextStatus}`,
    }
  }

  if (nextStatus === 'open' && !existing.legal_authorized) {
    return { error: 'Legal authorization must be confirmed before opening registration' }
  }

  const { error } = await supabase
    .from('events')
    .update({ status: nextStatus })
    .eq('id', input.eventId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'event.status_changed',
    entityType: 'event',
    entityId: input.eventId,
    oldValues: { status: currentStatus },
    newValues: { status: nextStatus, name: existing.name },
    reason: input.reason,
  })

  return {}
}

export async function updatePrizeStructure(
  actorId: string,
  input: UpdatePrizeStructureInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, status, name')
    .eq('id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (eventError) return { error: eventError.message }
  if (!event) return { error: 'Event not found' }

  const status = event.status as EventRow['status']
  if (!canEditEventDetails(status) && status !== 'registration_closed') {
    return { error: 'Prize structure cannot be changed in the current status' }
  }

  const { data: existingPrize, error: prizeFetchError } = await supabase
    .from('prize_structures')
    .select('id, prize_type, config')
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (prizeFetchError) return { error: prizeFetchError.message }

  const payload = {
    prize_type: input.prizeStructure.prizeType,
    config: input.prizeStructure.config as Json,
  }

  const { error: prizeError } = existingPrize
    ? await supabase
        .from('prize_structures')
        .update(payload)
        .eq('event_id', input.eventId)
    : await supabase.from('prize_structures').insert({
        event_id: input.eventId,
        ...payload,
      })

  if (prizeError) return { error: prizeError.message }

  await writeAuditLog({
    actorId,
    action: 'event.prize_structure_updated',
    entityType: 'event',
    entityId: input.eventId,
    oldValues: existingPrize
      ? { prizeType: existingPrize.prize_type, config: existingPrize.config }
      : null,
    newValues: {
      prizeType: input.prizeStructure.prizeType,
      config: input.prizeStructure.config,
      eventName: event.name,
    },
  })

  return {}
}

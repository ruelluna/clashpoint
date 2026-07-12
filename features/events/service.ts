import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
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

  return {
    promoter_id: isClassic ? null : (input.promoterId ?? null),
    name: input.name,
    venue: settings.defaultVenue,
    event_date: input.eventDate,
    registration_deadline: isClassic ? null : (input.registrationDeadline ?? null),
    event_type: input.eventType,
    derby_type: isClassic ? null : (input.derbyType ?? null),
    entry_fee: 0,
    tax_per_fight: input.taxPerFight,
    min_entries: null,
    max_entries: null,
    cocks_per_entry: resolveCocksPerEntry(
      input.eventType,
      input.derbyType,
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

export async function updateEvent(
  actorId: string,
  input: UpdateEventInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('events')
    .select('status, name')
    .eq('id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Event not found' }
  if (!canEditEventDetails(existing.status as EventRow['status'])) {
    return { error: 'Event details cannot be edited in the current status' }
  }

  const { error } = await supabase
    .from('events')
    .update(await toEventInsert(input))
    .eq('id', input.eventId)

  if (error) return { error: error.message }

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
    oldValues: { name: existing.name, status: existing.status },
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

import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import {
  entryHasMatchReferences,
  getPairedRosterIdsForEntry,
  listEntryNumbersForEvent,
} from '@/features/entries/queries'
import { getNextEntryNumber } from '@/features/entries/schema'
import type {
  CreateEntryInput,
  DeleteEntryInput,
  UpdateEntryInput,
  UpdateEntryRosterItemInput,
} from '@/features/entries/schema'
import { getEvent } from '@/features/events/queries'
import { createRoosterForEntry } from '@/features/weighing/service'
import { evaluateWeightStatus } from '@/features/weighing/schema'
import { createClient } from '@/lib/supabase/server'

export async function createEntry(
  actorId: string,
  input: CreateEntryInput
): Promise<{ error?: string; entryId?: string }> {
  const supabase = await createClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name, status, max_entries')
    .eq('id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (eventError) return { error: eventError.message }
  if (!event) return { error: 'Event not found' }
  if (event.status !== 'open') {
    return { error: 'Registrations are only accepted while the event is open' }
  }

  if (event.max_entries != null) {
    const { count, error: countError } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', input.eventId)
      .is('deleted_at', null)
      .not('registration_status', 'in', '("rejected","cancelled")')

    if (countError) return { error: countError.message }
    if ((count ?? 0) >= event.max_entries) {
      return { error: 'Maximum entries reached for this event' }
    }
  }

  const existingNumbers = await listEntryNumbersForEvent(input.eventId)
  const entryNumber = getNextEntryNumber(existingNumbers)

  const { data, error } = await supabase
    .from('entries')
    .insert({
      event_id: input.eventId,
      referred_by_promoter_id: input.referredByPromoterId ?? null,
      entry_number: entryNumber,
      entry_name: input.entryName,
      owner_name: input.ownerName,
      handler_name: input.handlerName ?? null,
      contact_number: input.contactNumber ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      entry_source: input.entrySource,
      registration_status: 'submitted',
      payment_status: 'unpaid',
      notes: input.notes ?? null,
      created_by: actorId,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to create entry' }
  }

  await writeAuditLog({
    actorId,
    action: 'entry.created',
    entityType: 'entry',
    entityId: data.id,
    newValues: {
      event_id: input.eventId,
      event_name: event.name,
      entry_number: entryNumber,
      entry_name: input.entryName,
      owner_name: input.ownerName,
    },
  })

  return { entryId: data.id }
}

export async function createEntryWithRooster(
  actorId: string,
  input: CreateEntryInput
): Promise<{ error?: string; entryId?: string; roosterId?: string }> {
  const entryResult = await createEntry(actorId, input)
  if (entryResult.error || !entryResult.entryId) {
    return { error: entryResult.error ?? 'Failed to create entry' }
  }

  const roosterResult = await createRoosterForEntry(actorId, {
    eventId: input.eventId,
    entryId: entryResult.entryId,
    bandNumber: input.bandNumber,
    weight: input.weight,
    category: input.category,
    colorMarking: input.colorMarking,
  })

  if (roosterResult.error) {
    const supabase = await createClient()
    await supabase.from('entries').delete().eq('id', entryResult.entryId)
    return { error: roosterResult.error }
  }

  return { entryId: entryResult.entryId, roosterId: roosterResult.roosterId }
}

export async function updateEntry(
  actorId: string,
  input: UpdateEntryInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('entries')
    .select('id, event_id, entry_number, entry_name')
    .eq('id', input.entryId)
    .eq('event_id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Entry not found' }

  const { error } = await supabase
    .from('entries')
    .update({
      referred_by_promoter_id: input.referredByPromoterId ?? null,
      entry_name: input.entryName,
      owner_name: input.ownerName,
      handler_name: input.handlerName ?? null,
      contact_number: input.contactNumber ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      entry_source: input.entrySource,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.entryId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'entry.updated',
    entityType: 'entry',
    entityId: input.entryId,
    oldValues: {
      entry_number: existing.entry_number,
      entry_name: existing.entry_name,
    },
    newValues: {
      entry_name: input.entryName,
      owner_name: input.ownerName,
    },
  })

  return {}
}

export async function updateEntryRoosters(
  actorId: string,
  eventId: string,
  entryId: string,
  roosters: UpdateEntryRosterItemInput[]
): Promise<{ error?: string }> {
  if (roosters.length === 0) return {}

  const supabase = await createClient()
  const event = await getEvent(eventId)
  if (!event) return { error: 'Event not found' }

  const pairedIds = await getPairedRosterIdsForEntry(eventId, entryId)

  for (const rooster of roosters) {
    if (pairedIds.has(rooster.roosterId)) {
      continue
    }

    const { data: record, error: recordError } = await supabase
      .from('rooster_records')
      .select('id, entry_id, event_id, band_number, cock_number')
      .eq('id', rooster.roosterId)
      .eq('entry_id', entryId)
      .eq('event_id', eventId)
      .maybeSingle()

    if (recordError) return { error: recordError.message }
    if (!record) return { error: 'Rooster not found for this entry' }

    const band = rooster.bandNumber.trim()
    const { data: bandConflict, error: bandError } = await supabase
      .from('rooster_records')
      .select('id')
      .eq('event_id', eventId)
      .ilike('band_number', band)
      .neq('id', rooster.roosterId)
      .maybeSingle()

    if (bandError) return { error: bandError.message }
    if (bandConflict) {
      return { error: `Band number ${band} is already registered for this event` }
    }

    const weightStatus = evaluateWeightStatus(
      rooster.weight,
      event.min_weight,
      event.max_weight
    )

    const { error: roosterUpdateError } = await supabase
      .from('rooster_records')
      .update({
        band_number: band,
        declared_weight: rooster.weight,
        category: rooster.category ?? null,
        color_marking: rooster.colorMarking ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rooster.roosterId)

    if (roosterUpdateError) return { error: roosterUpdateError.message }

    const { data: weighing } = await supabase
      .from('weighings')
      .select('id')
      .eq('rooster_record_id', rooster.roosterId)
      .maybeSingle()

    const weighingPayload = {
      official_weight: rooster.weight,
      weight_status: weightStatus,
      verified_by: actorId,
      verified_at: new Date().toISOString(),
    }

    if (weighing) {
      const { error: weighingError } = await supabase
        .from('weighings')
        .update(weighingPayload)
        .eq('id', weighing.id)

      if (weighingError) return { error: weighingError.message }
    } else {
      const { error: weighingError } = await supabase.from('weighings').insert({
        rooster_record_id: rooster.roosterId,
        entry_id: entryId,
        event_id: eventId,
        ...weighingPayload,
      })

      if (weighingError) return { error: weighingError.message }
    }

    await writeAuditLog({
      actorId,
      action: 'rooster.updated',
      entityType: 'rooster_record',
      entityId: rooster.roosterId,
      newValues: {
        entry_id: entryId,
        band_number: band,
        weight: rooster.weight,
        weight_status: weightStatus,
      },
    })
  }

  return {}
}

export async function deleteEntry(
  actorId: string,
  input: DeleteEntryInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('entries')
    .select('id, event_id, entry_number, entry_name')
    .eq('id', input.entryId)
    .eq('event_id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Entry not found' }

  const hasMatches = await entryHasMatchReferences(input.eventId, input.entryId)
  if (hasMatches) {
    return { error: 'Entry is in a match and cannot be deleted' }
  }

  const { error } = await supabase
    .from('entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', input.entryId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'entry.deleted',
    entityType: 'entry',
    entityId: input.entryId,
    oldValues: {
      entry_number: existing.entry_number,
      entry_name: existing.entry_name,
    },
  })

  return {}
}

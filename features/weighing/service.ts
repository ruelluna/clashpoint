import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { getEvent } from '@/features/events/queries'
import {
  evaluateWeightStatus,
  type CreateRoosterInput,
  type RecordWeightInput,
  type VerifyWeightInput,
  validateCockCount,
} from '@/features/weighing/schema'
import type { WeightStatus } from '@/features/weighing/types'
import { createClient } from '@/lib/supabase/server'

export async function createRoosterForEntry(
  actorId: string,
  input: CreateRoosterInput
): Promise<{ error?: string; roosterId?: string }> {
  const supabase = await createClient()

  const event = await getEvent(input.eventId)
  if (!event) return { error: 'Event not found' }

  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('id, entry_number, entry_name')
    .eq('id', input.entryId)
    .eq('event_id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (entryError) return { error: entryError.message }
  if (!entry) return { error: 'Entry not found for this event' }

  const { data: existingRoosters, error: roosterError } = await supabase
    .from('rooster_records')
    .select('id, cock_number')
    .eq('entry_id', input.entryId)

  if (roosterError) return { error: roosterError.message }

  const cockCount = existingRoosters?.length ?? 0
  const countError = validateCockCount(cockCount + 1, event.cocks_per_entry)
  if (countError) return { error: countError }

  const nextCockNumber =
    (existingRoosters ?? []).reduce(
      (max, row) => Math.max(max, Number(row.cock_number)),
      0
    ) + 1

  const band = input.bandNumber.trim()
  const { data: bandConflict, error: bandError } = await supabase
    .from('rooster_records')
    .select('id')
    .eq('event_id', input.eventId)
    .ilike('band_number', band)
    .maybeSingle()

  if (bandError) return { error: bandError.message }
  if (bandConflict) {
    return { error: `Band number ${band} is already registered for this event` }
  }

  const weightStatus = evaluateWeightStatus(
    input.weight,
    event.min_weight,
    event.max_weight
  )
  const verifiedAt = new Date().toISOString()

  const { data: rooster, error: insertError } = await supabase
    .from('rooster_records')
    .insert({
      entry_id: input.entryId,
      event_id: input.eventId,
      cock_number: nextCockNumber,
      band_number: band,
      declared_weight: input.weight,
      category: input.category ?? null,
      color_marking: input.colorMarking ?? null,
      status: 'verified',
    })
    .select('id')
    .single()

  if (insertError || !rooster) {
    return { error: insertError?.message ?? 'Failed to create rooster' }
  }

  const { data: weighing, error: weighingError } = await supabase
    .from('weighings')
    .insert({
      rooster_record_id: rooster.id,
      entry_id: input.entryId,
      event_id: input.eventId,
      official_weight: input.weight,
      weight_status: weightStatus,
      verified_by: actorId,
      verified_at: verifiedAt,
    })
    .select('id')
    .single()

  if (weighingError || !weighing) {
    await supabase.from('rooster_records').delete().eq('id', rooster.id)
    return { error: weighingError?.message ?? 'Failed to record weight' }
  }

  await writeAuditLog({
    actorId,
    action: 'rooster.created',
    entityType: 'rooster_record',
    entityId: rooster.id,
    newValues: {
      event_id: input.eventId,
      entry_id: input.entryId,
      entry_number: entry.entry_number,
      band_number: band,
      cock_number: nextCockNumber,
      weight: input.weight,
      weight_status: weightStatus,
    },
  })

  return { roosterId: rooster.id }
}

export async function recordWeight(
  actorId: string,
  input: RecordWeightInput
): Promise<{ error?: string; weighingId?: string }> {
  const supabase = await createClient()

  const { data: rooster, error: roosterError } = await supabase
    .from('rooster_records')
    .select('id, entry_id, event_id, band_number, status')
    .eq('id', input.roosterRecordId)
    .maybeSingle()

  if (roosterError) return { error: roosterError.message }
  if (!rooster) return { error: 'Rooster record not found' }
  if (rooster.event_id !== input.eventId) {
    return { error: 'Rooster does not belong to this event' }
  }

  const event = await getEvent(input.eventId)
  if (!event) return { error: 'Event not found' }

  const weightStatus = evaluateWeightStatus(
    input.officialWeight,
    event.min_weight,
    event.max_weight
  )

  const { data: existing } = await supabase
    .from('weighings')
    .select('id, weight_status, verified_at')
    .eq('rooster_record_id', input.roosterRecordId)
    .maybeSingle()

  if (existing?.verified_at) {
    return { error: 'Weight already verified — contact an organizer to override' }
  }

  const payload = {
    rooster_record_id: input.roosterRecordId,
    entry_id: rooster.entry_id,
    event_id: input.eventId,
    official_weight: input.officialWeight,
    weight_status: weightStatus,
    notes: input.notes ?? null,
    verified_by: null,
    verified_at: null,
  }

  const { data: weighing, error: saveError } = existing
    ? await supabase
        .from('weighings')
        .update(payload)
        .eq('id', existing.id)
        .select('id')
        .single()
    : await supabase.from('weighings').insert(payload).select('id').single()

  if (saveError || !weighing) {
    return { error: saveError?.message ?? 'Failed to record weight' }
  }

  await writeAuditLog({
    actorId,
    action: 'weighing.recorded',
    entityType: 'weighing',
    entityId: weighing.id,
    newValues: {
      rooster_record_id: input.roosterRecordId,
      band_number: rooster.band_number,
      official_weight: input.officialWeight,
      weight_status: weightStatus,
    },
  })

  return { weighingId: weighing.id }
}

export async function verifyWeight(
  actorId: string,
  input: VerifyWeightInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: weighing, error: fetchError } = await supabase
    .from('weighings')
    .select(
      'id, event_id, rooster_record_id, official_weight, weight_status, verified_at'
    )
    .eq('id', input.weighingId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!weighing) return { error: 'Weighing record not found' }
  if (weighing.event_id !== input.eventId) {
    return { error: 'Weighing does not belong to this event' }
  }
  if (weighing.official_weight == null) {
    return { error: 'Official weight must be recorded before verification' }
  }
  if (weighing.verified_at) {
    return { error: 'Weight already verified' }
  }

  const event = await getEvent(input.eventId)
  if (!event) return { error: 'Event not found' }

  const weightStatus = evaluateWeightStatus(
    Number(weighing.official_weight),
    event.min_weight,
    event.max_weight
  )

  const verifiedAt = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('weighings')
    .update({
      weight_status: weightStatus,
      verified_by: actorId,
      verified_at: verifiedAt,
      notes: input.notes ?? null,
    })
    .eq('id', input.weighingId)

  if (updateError) return { error: updateError.message }

  await writeAuditLog({
    actorId,
    action: 'weighing.verified',
    entityType: 'weighing',
    entityId: input.weighingId,
    newValues: {
      rooster_record_id: weighing.rooster_record_id,
      official_weight: weighing.official_weight,
      weight_status: weightStatus,
      verified_at: verifiedAt,
    },
  })

  return {}
}

export async function isEligibleForMatching(roosterId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('weighings')
    .select('weight_status, verified_at')
    .eq('rooster_record_id', roosterId)
    .maybeSingle()

  if (error || !data) return false

  return (
    (data.weight_status as WeightStatus) === 'passed' && data.verified_at != null
  )
}

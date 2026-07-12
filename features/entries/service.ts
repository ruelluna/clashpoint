import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { findOrCreateCompetitor } from '@/features/competitors/service'
import { getCompetitor } from '@/features/competitors/queries'
import { applyRegistrationEligibility } from '@/features/eligibility/registration-bridge'
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
import { kgToGrams, parseCategoryToAgeClass } from '@/lib/derby/enums'
import { createExtendedClient } from '@/lib/supabase/extended'
import { createClient } from '@/lib/supabase/server'

type EntryOwnerFields = Pick<
  CreateEntryInput,
  'competitorId' | 'saveOwner' | 'ownerName' | 'contactNumber' | 'email' | 'address'
>

export async function resolveEntryCompetitor(
  actorId: string,
  input: EntryOwnerFields
): Promise<{ error?: string; competitorId?: string | null }> {
  if (input.competitorId) {
    const competitor = await getCompetitor(input.competitorId)
    if (!competitor) {
      return { error: 'Selected owner was not found' }
    }

    return { competitorId: competitor.id }
  }

  if (input.saveOwner) {
    const result = await findOrCreateCompetitor(actorId, {
      displayName: input.ownerName,
      contactNumber: input.contactNumber,
      email: input.email,
      address: input.address,
    })

    if (result.error) {
      return { error: result.error }
    }

    return { competitorId: result.competitorId ?? null }
  }

  return { competitorId: null }
}

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

  const competitorResult = await resolveEntryCompetitor(actorId, input)
  if (competitorResult.error) {
    return { error: competitorResult.error }
  }

  const extendedSupabase = await createExtendedClient()
  const { data, error } = await extendedSupabase
    .from('entries')
    .insert({
      event_id: input.eventId,
      referred_by_promoter_id: input.referredByPromoterId ?? null,
      competitor_id: competitorResult.competitorId ?? null,
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
      competitor_id: competitorResult.competitorId ?? null,
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
    ageClass: input.ageClass,
    originType: input.originType,
    breedingRelationship: input.breedingRelationship,
    experienceStatus: input.experienceStatus,
    bandLevel: input.bandLevel,
    bandOrganization: input.bandOrganization,
    bandYear: input.bandYear,
    bandSeason: input.bandSeason,
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

  const competitorResult = await resolveEntryCompetitor(actorId, input)
  if (competitorResult.error) {
    return { error: competitorResult.error }
  }

  const extendedSupabase = await createExtendedClient()
  const { error } = await extendedSupabase
    .from('entries')
    .update({
      referred_by_promoter_id: input.referredByPromoterId ?? null,
      competitor_id: competitorResult.competitorId ?? null,
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
      competitor_id: competitorResult.competitorId ?? null,
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

  const extended = await createExtendedClient()

  for (const rooster of roosters) {
    if (pairedIds.has(rooster.roosterId)) {
      continue
    }

    const { data: record, error: recordError } = await extended
      .from('rooster_event_registrations')
      .select('id, entry_id, event_id, band_number, cock_number, registry_rooster_id, registration_status')
      .eq('id', rooster.roosterId)
      .eq('entry_id', entryId)
      .eq('event_id', eventId)
      .maybeSingle()

    if (recordError) return { error: recordError.message }
    if (!record) return { error: 'Rooster not found for this entry' }

    const band = rooster.bandNumber.trim()
    const { data: bandConflict, error: bandError } = await supabase
      .from('rooster_event_registrations')
      .select('id')
      .eq('event_id', eventId)
      .ilike('band_number', band)
      .neq('id', rooster.roosterId)
      .maybeSingle()

    if (bandError) return { error: bandError.message }
    if (bandConflict) {
      return { error: `Band number ${band} is already registered for this event` }
    }

    const weightGrams = kgToGrams(rooster.weight)
    const weightStatus = evaluateWeightStatus(
      rooster.weight,
      event.min_weight,
      event.max_weight
    )
    const ageClass = rooster.ageClass ?? parseCategoryToAgeClass(rooster.category)

    const { error: roosterUpdateError } = await extended
      .from('rooster_event_registrations')
      .update({
        band_number: band,
        declared_weight: rooster.weight,
        declared_weight_grams: weightGrams,
        official_weight_grams: weightGrams,
        category: rooster.category ?? null,
        color_marking: rooster.colorMarking ?? null,
        weight_verification_status: weightStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rooster.roosterId)

    if (roosterUpdateError) return { error: roosterUpdateError.message }

    if (record.registry_rooster_id) {
      const { error: registryUpdateError } = await extended
        .from('roosters')
        .update({
          age_class: ageClass,
          origin_type: rooster.originType ?? 'unknown',
          breeding_relationship: rooster.breedingRelationship ?? 'unknown',
          declared_external_experience_status: rooster.experienceStatus ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.registry_rooster_id)
      if (registryUpdateError) return { error: registryUpdateError.message }

      if (rooster.bandLevel && event.event_type === 'derby') {
        const { data: existingBand } = await extended
          .from('rooster_bands')
          .select('id')
          .eq('rooster_id', record.registry_rooster_id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle()

        const bandPayload = {
          band_level: rooster.bandLevel,
          band_organization: rooster.bandOrganization ?? null,
          band_number: band,
          band_year: rooster.bandYear ?? null,
          band_season: rooster.bandSeason ?? null,
        }

        if (existingBand) {
          const { error: bandUpdateError } = await extended
            .from('rooster_bands')
            .update(bandPayload)
            .eq('id', existingBand.id)
          if (bandUpdateError) return { error: bandUpdateError.message }
        } else {
          const { error: bandInsertError } = await extended.from('rooster_bands').insert({
            rooster_id: record.registry_rooster_id,
            ...bandPayload,
            verification_status: 'unverified',
          })
          if (bandInsertError) return { error: bandInsertError.message }
        }
      }
    }

    const { data: weighing } = await supabase
      .from('weighings')
      .select('id')
      .eq('rooster_event_registration_id', rooster.roosterId)
      .maybeSingle()

    const weighingPayload = {
      official_weight: rooster.weight,
      official_weight_grams: weightGrams,
      weight_status: weightStatus,
      verified_by: actorId,
      verified_at: new Date().toISOString(),
    }

    if (weighing) {
      const { error: weighingError } = await extended
        .from('weighings')
        .update(weighingPayload)
        .eq('id', weighing.id)

      if (weighingError) return { error: weighingError.message }
    } else {
      const { error: weighingError } = await extended.from('weighings').insert({
        rooster_event_registration_id: rooster.roosterId,
        entry_id: entryId,
        event_id: eventId,
        ...weighingPayload,
      })

      if (weighingError) return { error: weighingError.message }
    }

    await writeAuditLog({
      actorId,
      action: 'rooster.updated',
      entityType: 'rooster_event_registration',
      entityId: rooster.roosterId,
      newValues: {
        entry_id: entryId,
        band_number: band,
        weight: rooster.weight,
        weight_status: weightStatus,
      },
    })

    if (event.event_type === 'derby') {
      const eligibilityResult = await applyRegistrationEligibility(
        actorId,
        eventId,
        rooster.roosterId,
        {
          blockOnIneligible: true,
          currentRegistrationStatus: record.registration_status as string,
        }
      )
      if (eligibilityResult.blocked || eligibilityResult.error) {
        return { error: eligibilityResult.error ?? 'Rooster is ineligible for this event' }
      }
    }
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

import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { resolveRegistrationBandNumber } from '@/features/entries/band-display'
import { getCompetitor } from '@/features/competitors/queries'
import { applyRegistrationEligibility } from '@/features/eligibility/registration-bridge'
import {
  entryHasMatchReferences,
  getPairedRosterIdsForEntry,
  listEntryNumbersForEvent,
  listOwnerBarcodesForEvent,
} from '@/features/entries/queries'
import { getNextEntryNumber, getNextOwnerBarcode } from '@/features/entries/schema'
import type {
  CreateEntryInput,
  CreateOwnerEntryInput,
  DeleteEntryInput,
  NewEntryRosterItemInput,
  RoosterEntryItemInput,
  UpdateEntryInput,
  UpdateEntryRosterItemInput,
} from '@/features/entries/schema'
import {
  DUPLICATE_ENTRY_ERROR,
  isDuplicateOwnerForEvent,
} from '@/features/entries/utils'
import { getEvent } from '@/features/events/queries'
import { eventFeeSettingsFromRow, snapshotFromSettings } from '@/features/events/fee-utils'
import { isRegistrationOpen } from '@/features/events/utils'
import { createRoosterForEntry } from '@/features/weighing/service'
import { evaluateWeightStatusGrams } from '@/features/weighing/schema'
import { resolveEventWeightLimitsGrams } from '@/features/entries/weight-utils'
import {
  ReferenceValueNotInCatalogError,
  resolveEntryReferenceValues,
  type CatalogResolutionOptions,
} from '@/features/reference-values/service'
import { createExtendedClient } from '@/lib/supabase/extended'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type EntryWriteOptions = {
  useAdminClient?: boolean
  catalogResolution?: CatalogResolutionOptions
}

async function resolveWriteClient(options?: EntryWriteOptions) {
  if (options?.useAdminClient) {
    const admin = createAdminClient()
    return {
      supabase: admin,
      extended: admin as Awaited<ReturnType<typeof createExtendedClient>>,
    }
  }

  return {
    supabase: await createClient(),
    extended: await createExtendedClient(),
  }
}

export async function assertOwnerNotAlreadyRegistered(
  eventId: string,
  ownerName: string,
  competitorId: string | null | undefined,
  options?: EntryWriteOptions & { excludeEntryId?: string }
): Promise<{ error?: string }> {
  const { supabase } = await resolveWriteClient(options)

  const { data, error } = await supabase
    .from('entries')
    .select('id, owner_name, competitor_id')
    .eq('event_id', eventId)
    .is('deleted_at', null)

  if (error) return { error: error.message }

  const duplicate = (data ?? []).some((row) =>
    isDuplicateOwnerForEvent(
      ownerName,
      competitorId,
      {
        id: row.id as string,
        owner_name: row.owner_name as string,
        competitor_id: row.competitor_id as string | null,
      },
      options?.excludeEntryId
    )
  )

  if (duplicate) {
    return { error: DUPLICATE_ENTRY_ERROR }
  }

  return {}
}

/** @deprecated Use assertOwnerNotAlreadyRegistered */
export async function assertOwnerHandlerNotAlreadyRegistered(
  eventId: string,
  ownerName: string,
  _handlerName: string | null | undefined,
  options?: EntryWriteOptions
): Promise<{ error?: string }> {
  return assertOwnerNotAlreadyRegistered(eventId, ownerName, undefined, options)
}

type EntryOwnerFields = Pick<
  CreateEntryInput,
  | 'competitorId'
  | 'ownerName'
  | 'contactFullName'
  | 'contactDesignation'
  | 'contactNumber'
  | 'email'
>

async function syncCompetitorContactFields(
  actorId: string,
  competitorId: string,
  input: EntryOwnerFields
): Promise<{ error?: string }> {
  const supabase = await createExtendedClient()
  const { error } = await supabase
    .from('competitors')
    .update({
      contact_full_name: input.contactFullName ?? null,
      contact_designation: input.contactDesignation ?? null,
      contact_number: input.contactNumber ?? null,
      email: input.email ?? null,
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', competitorId)
    .is('deleted_at', null)

  if (error) return { error: error.message }
  return {}
}

export async function resolveEntryCompetitor(
  actorId: string,
  input: EntryOwnerFields
): Promise<{ error?: string; competitorId?: string | null }> {
  if (input.competitorId) {
    const competitor = await getCompetitor(input.competitorId)
    if (!competitor) {
      return { error: 'Selected owner was not found' }
    }

    const syncResult = await syncCompetitorContactFields(actorId, competitor.id, input)
    if (syncResult.error) {
      return { error: syncResult.error }
    }

    return { competitorId: competitor.id }
  }

  return { competitorId: null }
}

export async function createEntry(
  actorId: string | null,
  input: CreateEntryInput | CreateOwnerEntryInput,
  options?: EntryWriteOptions
): Promise<{ error?: string; entryId?: string; entryNumber?: string; ownerBarcode?: string }> {
  const { supabase, extended: extendedSupabase } = await resolveWriteClient(options)

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(
      'id, name, status, max_entries, registration_deadline, event_type, entry_fee, registration_fee_enabled, registration_fee_amount, rooster_entry_fee_enabled, rooster_entry_fee_amount, cash_bond_enabled, cash_bond_amount'
    )
    .eq('id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (eventError) return { error: eventError.message }
  if (!event) return { error: 'Event not found' }
  if (!isRegistrationOpen(event)) {
    return { error: 'Registrations are only accepted while the event is open' }
  }

  const competitorResult = actorId
    ? await resolveEntryCompetitor(actorId, input)
    : { competitorId: null as string | null }
  if (competitorResult.error) {
    return { error: competitorResult.error }
  }

  const duplicateResult = await assertOwnerNotAlreadyRegistered(
    input.eventId,
    input.ownerName,
    competitorResult.competitorId,
    options
  )
  if (duplicateResult.error) {
    return { error: duplicateResult.error }
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

  const existingNumbers = await listEntryNumbersForEvent(input.eventId, options)
  const entryNumber = getNextEntryNumber(existingNumbers)

  const isDerby = event.event_type === 'derby'
  let ownerBarcode: string | null = null
  let feeSnapshot: Record<string, unknown> | null = null

  if (isDerby) {
    const existingBarcodes = await listOwnerBarcodesForEvent(input.eventId, options)
    ownerBarcode = getNextOwnerBarcode(input.eventId, existingBarcodes)
    feeSnapshot = snapshotFromSettings(eventFeeSettingsFromRow(event))
  }

  const feeSettings = eventFeeSettingsFromRow(event)
  const paymentStatus = feeSettings.registrationFeeEnabled ? 'unpaid' : 'paid'

  const { data, error } = await extendedSupabase
    .from('entries')
    .insert({
      event_id: input.eventId,
      referred_by_promoter_id: input.referredByPromoterId ?? null,
      competitor_id: competitorResult.competitorId ?? null,
      entry_number: entryNumber,
      entry_name: input.ownerName,
      owner_name: input.ownerName,
      contact_full_name: input.contactFullName ?? null,
      contact_designation: input.contactDesignation ?? null,
      contact_number: input.contactNumber ?? null,
      email: input.email ?? null,
      address: null,
      entry_source: input.entrySource,
      registration_status: 'submitted',
      payment_status: paymentStatus,
      notes: input.notes ?? null,
      created_by: actorId,
      owner_barcode: ownerBarcode,
      fee_snapshot: feeSnapshot,
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
      entry_name: input.ownerName,
      owner_name: input.ownerName,
      competitor_id: competitorResult.competitorId ?? null,
      owner_barcode: ownerBarcode,
      ...(input.entrySource === 'online' ? { source: 'online' } : {}),
    },
  })

  return {
    entryId: data.id,
    entryNumber,
    ownerBarcode: ownerBarcode ?? undefined,
  }
}

function toCreateRoosterInput(
  eventId: string,
  entryId: string,
  rooster: RoosterEntryItemInput | NewEntryRosterItemInput
) {
  return {
    eventId,
    entryId,
    entryName: rooster.entryName,
    bandNumber: rooster.bandNumber,
    weight: rooster.weight,
    handlerName: rooster.handlerName,
    colorMarking: rooster.colorMarking,
    notes: rooster.notes,
    ageClass: 'ageClass' in rooster ? rooster.ageClass : undefined,
    originType: 'originType' in rooster ? rooster.originType : undefined,
    breedingRelationship:
      'breedingRelationship' in rooster ? rooster.breedingRelationship : undefined,
    experienceStatus: 'experienceStatus' in rooster ? rooster.experienceStatus : undefined,
    bandLevel: 'bandLevel' in rooster ? rooster.bandLevel : undefined,
    bandOrganization: 'bandOrganization' in rooster ? rooster.bandOrganization : undefined,
    bandYear: 'bandYear' in rooster ? rooster.bandYear : undefined,
    bandSeason: 'bandSeason' in rooster ? rooster.bandSeason : undefined,
    breed: rooster.breed,
    bloodline: 'bloodline' in rooster ? rooster.bloodline : undefined,
    competitionClass: 'competitionClass' in rooster ? rooster.competitionClass : undefined,
    hatchDate: 'hatchDate' in rooster ? rooster.hatchDate : undefined,
    hatchDateIsEstimated:
      'hatchDateIsEstimated' in rooster ? rooster.hatchDateIsEstimated : undefined,
    countryOfOrigin: 'countryOfOrigin' in rooster ? rooster.countryOfOrigin : undefined,
    provinceOfOrigin: 'provinceOfOrigin' in rooster ? rooster.provinceOfOrigin : undefined,
    municipalityOfOrigin:
      'municipalityOfOrigin' in rooster ? rooster.municipalityOfOrigin : undefined,
    breederNameExternal:
      'breederNameExternal' in rooster ? rooster.breederNameExternal : undefined,
    originNotes: 'originNotes' in rooster ? rooster.originNotes : undefined,
  }
}

async function rollbackCreatedEntry(
  entryId: string,
  roosterIds: string[],
  options?: EntryWriteOptions
) {
  const { supabase, extended } = await resolveWriteClient(options)

  for (const roosterId of roosterIds) {
    const { data: record } = await extended
      .from('rooster_event_registrations')
      .select('registry_rooster_id')
      .eq('id', roosterId)
      .maybeSingle()

    await supabase.from('weighings').delete().eq('rooster_event_registration_id', roosterId)
    await supabase.from('rooster_event_registrations').delete().eq('id', roosterId)

    if (record?.registry_rooster_id) {
      await extended
        .from('rooster_bands')
        .delete()
        .eq('rooster_id', record.registry_rooster_id)
      await extended.from('roosters').delete().eq('id', record.registry_rooster_id)
    }
  }

  await supabase.from('entries').delete().eq('id', entryId)
}

export async function createEntryWithRoosters(
  actorId: string | null,
  input: CreateEntryInput,
  options?: EntryWriteOptions
): Promise<{ error?: string; entryId?: string; roosterIds?: string[] }> {
  const entryResult = await createEntry(actorId, input, options)
  if (entryResult.error || !entryResult.entryId) {
    return { error: entryResult.error ?? 'Failed to create entry' }
  }

  const createdRoosterIds: string[] = []

  for (const rooster of input.roosters) {
    const roosterResult = await createRoosterForEntry(
      actorId,
      toCreateRoosterInput(input.eventId, entryResult.entryId, rooster),
      options
    )

    if (roosterResult.error || !roosterResult.roosterId) {
      await rollbackCreatedEntry(entryResult.entryId, createdRoosterIds, options)
      return { error: roosterResult.error ?? 'Failed to create rooster' }
    }

    createdRoosterIds.push(roosterResult.roosterId)
  }

  return { entryId: entryResult.entryId, roosterIds: createdRoosterIds }
}

/** @deprecated Use createEntryWithRoosters */
export async function createEntryWithRooster(
  actorId: string,
  input: CreateEntryInput
): Promise<{ error?: string; entryId?: string; roosterId?: string }> {
  const result = await createEntryWithRoosters(actorId, input)
  return {
    error: result.error,
    entryId: result.entryId,
    roosterId: result.roosterIds?.[0],
  }
}

export async function addEntryRoosters(
  actorId: string,
  eventId: string,
  entryId: string,
  roosters: NewEntryRosterItemInput[]
): Promise<{ error?: string; roosterIds?: string[] }> {
  if (roosters.length === 0) return {}

  const createdRoosterIds: string[] = []

  for (const rooster of roosters) {
    const roosterResult = await createRoosterForEntry(
      actorId,
      toCreateRoosterInput(eventId, entryId, rooster)
    )

    if (roosterResult.error || !roosterResult.roosterId) {
      return { error: roosterResult.error ?? 'Failed to add rooster' }
    }

    createdRoosterIds.push(roosterResult.roosterId)
  }

  return { roosterIds: createdRoosterIds }
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

  const duplicateResult = await assertOwnerNotAlreadyRegistered(
    input.eventId,
    input.ownerName,
    competitorResult.competitorId,
    { excludeEntryId: input.entryId }
  )
  if (duplicateResult.error) {
    return { error: duplicateResult.error }
  }

  const extendedSupabase = await createExtendedClient()
  const { error } = await extendedSupabase
    .from('entries')
    .update({
      referred_by_promoter_id: input.referredByPromoterId ?? null,
      competitor_id: competitorResult.competitorId ?? null,
      entry_name: input.ownerName,
      owner_name: input.ownerName,
      contact_full_name: input.contactFullName ?? null,
      contact_designation: input.contactDesignation ?? null,
      contact_number: input.contactNumber ?? null,
      email: input.email ?? null,
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
      entry_name: input.ownerName,
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

    const userBand = rooster.bandNumber?.trim() ?? ''
    const band = resolveRegistrationBandNumber({
      bandNumber: userBand,
      entryId,
      cockNumber: Number(record.cock_number),
    })

    if (userBand) {
      const { data: bandConflict, error: bandError } = await supabase
        .from('rooster_event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .ilike('band_number', userBand)
        .neq('id', rooster.roosterId)
        .maybeSingle()

      if (bandError) return { error: bandError.message }
      if (bandConflict) {
        return { error: `Band number ${userBand} is already registered for this event` }
      }
    }

    const weightGrams = Math.round(rooster.weight)
    const { minWeightGrams, maxWeightGrams } = resolveEventWeightLimitsGrams(event)
    const weightStatus = evaluateWeightStatusGrams(
      weightGrams,
      minWeightGrams,
      maxWeightGrams
    )
    const ageClass = rooster.ageClass ?? 'unknown'

    let cataloged: Awaited<ReturnType<typeof resolveEntryReferenceValues>>
    try {
      cataloged = await resolveEntryReferenceValues(
        {
          breed: rooster.breed,
          bloodline: rooster.bloodline,
          colorMarking: rooster.colorMarking,
        },
        { mode: 'strict' }
      )
    } catch (error) {
      if (error instanceof ReferenceValueNotInCatalogError) {
        return { error: error.message }
      }
      throw error
    }

    const { error: roosterUpdateError } = await extended
      .from('rooster_event_registrations')
      .update({
        band_number: band,
        declared_weight: weightGrams / 1000,
        declared_weight_grams: weightGrams,
        official_weight_grams: weightGrams,
        color_marking: cataloged.colorMarking,
        handler_name: rooster.handlerName ?? null,
        notes: rooster.notes ?? null,
        weight_verification_status: weightStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rooster.roosterId)

    if (roosterUpdateError) return { error: roosterUpdateError.message }

    if (record.registry_rooster_id) {
      const { error: registryUpdateError } = await extended
        .from('roosters')
        .update({
          name: rooster.entryName,
          age_class: ageClass,
          competition_class: rooster.competitionClass ?? 'unclassified',
          hatch_date: rooster.hatchDate ?? null,
          hatch_date_is_estimated: rooster.hatchDateIsEstimated ?? false,
          breed: cataloged.breed,
          bloodline: cataloged.bloodline,
          origin_type: rooster.originType ?? 'unknown',
          country_of_origin: rooster.countryOfOrigin ?? null,
          province_of_origin: rooster.provinceOfOrigin ?? null,
          municipality_of_origin: rooster.municipalityOfOrigin ?? null,
          breeder_name_external: rooster.breederNameExternal ?? null,
          breeding_relationship: rooster.breedingRelationship ?? 'unknown',
          origin_notes: rooster.originNotes ?? null,
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
      official_weight: weightGrams / 1000,
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
        weight: weightGrams,
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

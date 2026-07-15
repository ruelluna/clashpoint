import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { applyRegistrationEligibility } from '@/features/eligibility/registration-bridge'
import { listCockEntryBarcodesForEvent } from '@/features/entries/queries'
import { getNextCockEntryBarcode } from '@/features/entries/schema'
import { getEvent } from '@/features/events/queries'
import { createRooster } from '@/features/roosters/service'
import { createRoosterSchema as registryRoosterSchema } from '@/features/roosters/schema'
import {
  evaluateWeightStatus,
  evaluateWeightStatusGrams,
  type CreateRoosterInput,
  type RecordWeightInput,
  type VerifyWeightInput,
  validateCockCount,
} from '@/features/weighing/schema'
import type { WeightStatus } from '@/features/weighing/types'
import { resolveEventWeightLimitsGrams } from '@/features/entries/weight-utils'
import { catalogReferenceValues } from '@/features/reference-values/service'
import type { AgeClass, BandLevel } from '@/lib/derby/enums'
import { createExtendedClient } from '@/lib/supabase/extended'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

type WriteClientOptions = {
  useAdminClient?: boolean
}

async function resolveWriteClient(options?: WriteClientOptions) {
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

async function rollbackRoosterCreation(input: {
  supabase: Awaited<ReturnType<typeof createClient>>
  extended: Awaited<ReturnType<typeof createExtendedClient>>
  registrationId?: string
  weighingId?: string
  registryRoosterId?: string
}) {
  if (input.weighingId) {
    await input.supabase.from('weighings').delete().eq('id', input.weighingId)
  }
  if (input.registrationId) {
    await input.supabase
      .from('rooster_event_registrations')
      .delete()
      .eq('id', input.registrationId)
  }
  if (input.registryRoosterId) {
    await input.extended
      .from('rooster_bands')
      .delete()
      .eq('rooster_id', input.registryRoosterId)
    await input.extended.from('roosters').delete().eq('id', input.registryRoosterId)
  }
}

function resolveAgeClass(input: CreateRoosterInput): AgeClass {
  return input.ageClass ?? 'unknown'
}

async function createRegistryBand(
  extended: Awaited<ReturnType<typeof createExtendedClient>>,
  registryRoosterId: string,
  input: CreateRoosterInput,
  bandNumber: string
) {
  if (!input.bandLevel) return null

  const { error } = await extended.from('rooster_bands').insert({
    rooster_id: registryRoosterId,
    band_level: input.bandLevel as BandLevel,
    band_organization: input.bandOrganization ?? null,
    band_number: bandNumber,
    band_year: input.bandYear ?? null,
    band_season: input.bandSeason ?? null,
    verification_status: 'unverified',
  })

  return error?.message ?? null
}

export async function createRoosterForEntry(
  actorId: string | null,
  input: CreateRoosterInput,
  options?: WriteClientOptions
): Promise<{ error?: string; roosterId?: string; cockEntryBarcode?: string }> {
  const { supabase, extended } = await resolveWriteClient(options)

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
    .from('rooster_event_registrations')
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
    .from('rooster_event_registrations')
    .select('id')
    .eq('event_id', input.eventId)
    .ilike('band_number', band)
    .maybeSingle()

  if (bandError) return { error: bandError.message }
  if (bandConflict) {
    return { error: `Band number ${band} is already registered for this event` }
  }

  const ageClass = resolveAgeClass(input)

  const cataloged = await catalogReferenceValues({
    breed: input.breed,
    bloodline: input.bloodline,
    colorMarking: input.colorMarking,
  })

  const registryResult = await createRooster(
    actorId,
    registryRoosterSchema.parse({
      name: input.entryName,
      ageClass,
      competitionClass: input.competitionClass ?? 'unclassified',
      hatchDate: input.hatchDate,
      hatchDateIsEstimated: input.hatchDateIsEstimated ?? false,
      breed: cataloged.breed ?? undefined,
      bloodline: cataloged.bloodline ?? undefined,
      originType: input.originType ?? 'unknown',
      countryOfOrigin: input.countryOfOrigin,
      provinceOfOrigin: input.provinceOfOrigin,
      municipalityOfOrigin: input.municipalityOfOrigin,
      breederNameExternal: input.breederNameExternal,
      breedingRelationship: input.breedingRelationship ?? 'unknown',
      originNotes: input.originNotes,
      declaredExternalExperienceStatus: input.experienceStatus ?? null,
    }),
    options
  )

  if (registryResult.error || !registryResult.roosterId) {
    return { error: registryResult.error ?? 'Failed to create registry rooster' }
  }

  const bandInsertError = await createRegistryBand(
    extended,
    registryResult.roosterId,
    input,
    band
  )
  if (bandInsertError) {
    await rollbackRoosterCreation({
      supabase,
      extended,
      registryRoosterId: registryResult.roosterId,
    })
    return { error: bandInsertError }
  }

  const { data: eventFlags } = await extended
    .from('events')
    .select(
      'require_rooster_entry_approval, eligibility_enforcement_enabled, event_type, rooster_entry_fee_enabled'
    )
    .eq('id', input.eventId)
    .maybeSingle()

  const requiresApproval = Boolean(eventFlags?.require_rooster_entry_approval)
  const isDerby = eventFlags?.event_type === 'derby'
  const roosterEntryFeeEnabled = Boolean(eventFlags?.rooster_entry_fee_enabled)
  const regPaymentStatus = roosterEntryFeeEnabled ? 'unpaid' : 'not_required'

  const declaredWeightGrams =
    input.weight != null && input.weight > 0 ? Math.round(input.weight) : null

  let cockEntryBarcode: string | null = null
  if (isDerby) {
    const existingBarcodes = await listCockEntryBarcodesForEvent(input.eventId)
    cockEntryBarcode = getNextCockEntryBarcode(input.eventId, existingBarcodes)
  }

  const submittedAt = new Date().toISOString()

  const { data: rooster, error: insertError } = await supabase
    .from('rooster_event_registrations')
    .insert({
      entry_id: input.entryId,
      event_id: input.eventId,
      cock_entry_barcode: cockEntryBarcode,
      registry_rooster_id: registryResult.roosterId,
      cock_number: nextCockNumber,
      band_number: band,
      declared_weight:
        declaredWeightGrams != null ? declaredWeightGrams / 1000 : null,
      declared_weight_grams: declaredWeightGrams,
      official_weight_grams: null,
      category: null,
      color_marking: cataloged.colorMarking,
      handler_name: input.handlerName ?? null,
      notes: input.notes ?? null,
      status: 'submitted',
      registration_status: 'pending_inspection',
      approval_status: requiresApproval ? 'pending' : 'pending',
      eligibility_status: 'pending_review',
      inspection_status: 'pending',
      reg_payment_status: regPaymentStatus,
      weight_verified: false,
      weight_verification_status: 'pending',
      weighed_at: null,
      weighed_by: null,
      submitted_by: actorId,
      submitted_at: submittedAt,
    })
    .select('id')
    .single()

  if (insertError || !rooster) {
    await rollbackRoosterCreation({
      supabase,
      extended,
      registryRoosterId: registryResult.roosterId,
    })
    return { error: insertError?.message ?? 'Failed to create rooster' }
  }

  if (isDerby && actorId) {
    await applyRegistrationEligibility(
      actorId,
      input.eventId,
      rooster.id,
      { blockOnIneligible: false, currentRegistrationStatus: 'pending_inspection' }
    )
  }

  await writeAuditLog({
    actorId,
    action: 'rooster.created',
    entityType: 'rooster_event_registration',
    entityId: rooster.id,
    newValues: {
      event_id: input.eventId,
      entry_id: input.entryId,
      entry_number: entry.entry_number,
      band_number: band,
      cock_number: nextCockNumber,
      declared_weight_grams: declaredWeightGrams,
      reg_payment_status: regPaymentStatus,
      registration_status: 'pending_inspection',
    },
  })

  return {
    roosterId: rooster.id,
    cockEntryBarcode: cockEntryBarcode ?? undefined,
  }
}

export async function recordWeight(
  actorId: string,
  input: RecordWeightInput
): Promise<{ error?: string; weighingId?: string }> {
  const supabase = await createClient()

  const { data: rooster, error: roosterError } = await supabase
    .from('rooster_event_registrations')
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
    .eq('rooster_event_registration_id', input.roosterRecordId)
    .maybeSingle()

  if (existing?.verified_at) {
    return { error: 'Weight already verified — contact an organizer to override' }
  }

  const payload = {
    rooster_event_registration_id: input.roosterRecordId,
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

  const weightGrams = Math.round(input.officialWeight * 1000)
  await supabase
    .from('rooster_event_registrations')
    .update({
      official_weight_grams: null,
      declared_weight: input.officialWeight,
      declared_weight_grams: weightGrams,
      weight_verified: false,
      weight_verification_status: weightStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.roosterRecordId)

  await writeAuditLog({
    actorId,
    action: 'weighing.recorded',
    entityType: 'weighing',
    entityId: weighing.id,
    newValues: {
      rooster_event_registration_id: input.roosterRecordId,
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
      'id, event_id, rooster_event_registration_id, official_weight, weight_status, verified_at'
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

  const weightGrams = Math.round(Number(weighing.official_weight) * 1000)
  const { minWeightGrams, maxWeightGrams } = resolveEventWeightLimitsGrams(event)
  const weightVerificationStatus = evaluateWeightStatusGrams(
    weightGrams,
    minWeightGrams,
    maxWeightGrams
  )

  await supabase
    .from('rooster_event_registrations')
    .update({
      official_weight_grams: weightGrams,
      declared_weight: Number(weighing.official_weight),
      weight_verified: true,
      weight_verification_status: weightVerificationStatus,
      weighed_at: verifiedAt,
      weighed_by: actorId,
      updated_at: verifiedAt,
    })
    .eq('id', weighing.rooster_event_registration_id)

  await writeAuditLog({
    actorId,
    action: 'weighing.verified',
    entityType: 'weighing',
    entityId: input.weighingId,
    newValues: {
      rooster_event_registration_id: weighing.rooster_event_registration_id,
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
    .eq('rooster_event_registration_id', roosterId)
    .maybeSingle()

  if (error || !data) return false

  return (
    (data.weight_status as WeightStatus) === 'passed' && data.verified_at != null
  )
}

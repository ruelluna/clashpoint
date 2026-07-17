'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  getEntryFormEligibilityContext,
  toPolicyValidationContext,
} from '@/features/eligibility/registration-bridge'
import { isEligibilityFieldEnabled } from '@/lib/derby/eligibility-fields'
import type { EligibilityFieldKey } from '@/lib/derby/eligibility-fields'
import {
  createEntrySchema,
  createOwnerEntrySchema,
  deleteEntrySchema,
  entryMetadataSchema,
  parseCreateEntryFromFormData,
  parseNewRosterSlotsFromFormData,
  parseUpdateEntryRosterFromForm,
  updateEntrySchema,
  validateEntryRosterCount,
} from '@/features/entries/schema'
import { validateRoosterAgainstPolicy } from '@/features/entries/policy-validation'
import {
  addEntryRoosters,
  createEntry,
  createEntryWithRoosters,
  deleteEntry,
  updateEntry,
  updateEntryRoosters,
} from '@/features/entries/service'
import { getEntryIdByOwnerBarcode, getPairedRosterIdsForEntry } from '@/features/entries/queries'
import { getEvent } from '@/features/events/queries'
import { requireAnyPermission, requirePermission } from '@/lib/auth/permissions'
import {
  isOwnerBarcodeForEvent,
  normalizeOwnerBarcodeInput,
} from '@/features/entries/schema'

export type EntryActionState = { error?: string; success?: string }

export type OwnerBarcodeLookupResult = { entryId?: string; error?: string }

export async function lookupOwnerEntryByBarcodeAction(
  eventId: string,
  rawBarcode: string
): Promise<OwnerBarcodeLookupResult> {
  await requireAnyPermission([
    'owner_registration.manage',
    'entries.manage',
    'events.view',
    'cock_entry.manage',
  ])

  const barcode = normalizeOwnerBarcodeInput(rawBarcode)
  if (!barcode) {
    return { error: 'Enter a barcode to scan' }
  }

  if (!isOwnerBarcodeForEvent(barcode, eventId)) {
    return { error: 'This barcode does not belong to this event' }
  }

  const entryId = await getEntryIdByOwnerBarcode(eventId, barcode)
  if (!entryId) {
    return { error: `No owner found for barcode ${barcode}` }
  }

  return { entryId }
}

function parseOptionalUuid(value: FormDataEntryValue | null): string | null {
  if (value == null || value.toString().trim() === '') return null
  return value.toString()
}

function revalidateEntryPaths(eventId: string) {
  revalidatePath(`/dashboard/events/${eventId}/owners`)
  revalidatePath(`/dashboard/events/${eventId}/roosters`)
  revalidatePath(`/dashboard/events/${eventId}/matching`)
  revalidatePath(`/dashboard/events/${eventId}/reports/weighing`)
}

function validateCreateWeightOnly(
  roosters: Array<{ weight: number }>,
  eligibilityContext: Awaited<ReturnType<typeof getEntryFormEligibilityContext>>
): string | null {
  if (!eligibilityContext) return null
  if (!isEligibilityFieldEnabled(eligibilityContext.enabledFields, 'weight')) {
    return null
  }

  const policyContext = toPolicyValidationContext(eligibilityContext)
  const weightOnlyContext = {
    ...policyContext,
    enabledFields: ['weight'] as EligibilityFieldKey[],
  }

  for (const rooster of roosters) {
    const policyError = validateRoosterAgainstPolicy(
      { weight: rooster.weight },
      weightOnlyContext
    )
    if (policyError) return policyError
  }

  return null
}

function validateEditRosterPolicy(
  roosters: Array<{
    weight: number
    ageClass?: string
    originType?: string
    breedingRelationship?: string
    experienceStatus?: string
    bandLevel?: string
    bandOrganization?: string
    bandYear?: number
    bandSeason?: string
  }>,
  eligibilityContext: NonNullable<Awaited<ReturnType<typeof getEntryFormEligibilityContext>>>
): string | null {
  const policyContext = toPolicyValidationContext(eligibilityContext)
  for (const rooster of roosters) {
    const policyError = validateRoosterAgainstPolicy(rooster, policyContext)
    if (policyError) return policyError
  }
  return null
}

export async function createEntryAction(
  _prev: EntryActionState,
  formData: FormData
): Promise<EntryActionState> {
  const profile = await requirePermission('entries.manage')

  const parsedForm = parseCreateEntryFromFormData(formData)
  if (parsedForm.parseErrors.length > 0) {
    return { error: parsedForm.parseErrors[0] }
  }

  const createInput = {
    ...parsedForm.metadata,
    roosters: parsedForm.roosters,
  }

  const schemaResult = createEntrySchema.safeParse(createInput)
  if (!schemaResult.success) {
    return { error: schemaResult.error.issues[0]?.message ?? 'Invalid input' }
  }

  const event = await getEvent(schemaResult.data.eventId)
  if (!event) return { error: 'Event not found' }

  const countError = validateEntryRosterCount(
    schemaResult.data.roosters.length,
    event.event_type,
    event.cocks_per_entry
  )
  if (countError) return { error: countError }

  const eligibilityContext = await getEntryFormEligibilityContext(schemaResult.data.eventId)
  const weightError = validateCreateWeightOnly(
    schemaResult.data.roosters,
    eligibilityContext
  )
  if (weightError) return { error: weightError }

  const result = await createEntryWithRoosters(profile.id, schemaResult.data)
  if (result.error) return { error: result.error }

  revalidateEntryPaths(schemaResult.data.eventId)
  redirect(`/dashboard/events/${schemaResult.data.eventId}/roosters`)
}

function parseOwnerEntryFromFormData(formData: FormData) {
  return entryMetadataSchema.safeParse({
    eventId: formData.get('eventId'),
    referredByPromoterId: formData.get('referredByPromoterId')?.toString().trim() || undefined,
    competitorId: formData.get('competitorId')?.toString().trim() || undefined,
    ownerName: formData.get('ownerName'),
    contactFullName: formData.get('contactFullName')?.toString().trim() || undefined,
    contactDesignation: formData.get('contactDesignation')?.toString().trim() || undefined,
    contactNumber: formData.get('contactNumber')?.toString().trim() || undefined,
    email: formData.get('email')?.toString().trim() || undefined,
    entrySource: formData.get('entrySource')?.toString() ?? 'staff_encoded',
    notes: formData.get('notes')?.toString().trim() || undefined,
  })
}

export async function createOwnerEntryAction(
  _prev: EntryActionState,
  formData: FormData
): Promise<EntryActionState> {
  const profile = await requireAnyPermission([
    'owner_registration.manage',
    'entries.manage',
  ])

  const parsed = parseOwnerEntryFromFormData(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const schemaResult = createOwnerEntrySchema.safeParse(parsed.data)
  if (!schemaResult.success) {
    return { error: schemaResult.error.issues[0]?.message ?? 'Invalid input' }
  }

  const event = await getEvent(schemaResult.data.eventId)
  if (!event) return { error: 'Event not found' }

  const result = await createEntry(profile.id, schemaResult.data)
  if (result.error) return { error: result.error }
  if (!result.entryId) return { error: 'Failed to create entry' }

  revalidateEntryPaths(schemaResult.data.eventId)
  revalidatePath(`/dashboard/events/${schemaResult.data.eventId}/owners`)

  if (result.ownerBarcode) {
    redirect(
      `/dashboard/events/${schemaResult.data.eventId}/owners/${result.entryId}/print`
    )
  }

  redirect(`/dashboard/events/${schemaResult.data.eventId}/owners`)
}

export async function updateEntryAction(
  _prev: EntryActionState,
  formData: FormData
): Promise<EntryActionState> {
  const profile = await requirePermission('entries.manage')

  const parsed = updateEntrySchema.safeParse({
    eventId: formData.get('eventId'),
    entryId: formData.get('entryId'),
    referredByPromoterId: parseOptionalUuid(formData.get('referredByPromoterId')),
    competitorId: parseOptionalUuid(formData.get('competitorId')),
    ownerName: formData.get('ownerName'),
    contactFullName: formData.get('contactFullName')?.toString().trim() || undefined,
    contactDesignation: formData.get('contactDesignation')?.toString().trim() || undefined,
    contactNumber: formData.get('contactNumber')?.toString().trim() || undefined,
    email: formData.get('email')?.toString().trim() || undefined,
    entrySource: formData.get('entrySource')?.toString() ?? 'staff_encoded',
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const event = await getEvent(parsed.data.eventId)
  if (!event) return { error: 'Event not found' }

  const entryResult = await updateEntry(profile.id, parsed.data)
  if (entryResult.error) return { error: entryResult.error }

  const pairedIds = await getPairedRosterIdsForEntry(parsed.data.eventId, parsed.data.entryId)
  const roosterIds =
    formData
      .get('roosterIds')
      ?.toString()
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean) ?? []

  const rosterUpdates = roosterIds
    .filter((roosterId) => !pairedIds.has(roosterId))
    .map((roosterId) => parseUpdateEntryRosterFromForm(formData, roosterId))
    .filter((item): item is NonNullable<typeof item> => item != null)

  const newRosterSlots = parseNewRosterSlotsFromFormData(formData, event.cocks_per_entry)
  if (newRosterSlots.parseErrors.length > 0) {
    return { error: newRosterSlots.parseErrors[0] }
  }

  if (rosterUpdates.length > 0 || newRosterSlots.roosters.length > 0) {
    const eligibilityContext = await getEntryFormEligibilityContext(parsed.data.eventId)
    if (eligibilityContext) {
      const policyError = validateEditRosterPolicy(
        [...rosterUpdates, ...newRosterSlots.roosters],
        eligibilityContext
      )
      if (policyError) return { error: policyError }
    }
  }

  const rosterResult = await updateEntryRoosters(
    profile.id,
    parsed.data.eventId,
    parsed.data.entryId,
    rosterUpdates
  )
  if (rosterResult.error) return { error: rosterResult.error }

  if (newRosterSlots.roosters.length > 0) {
    const addResult = await addEntryRoosters(
      profile.id,
      parsed.data.eventId,
      parsed.data.entryId,
      newRosterSlots.roosters
    )
    if (addResult.error) return { error: addResult.error }
  }

  revalidateEntryPaths(parsed.data.eventId)
  revalidatePath(
    `/dashboard/events/${parsed.data.eventId}/rooster-entries/${parsed.data.entryId}/edit`
  )
  redirect(`/dashboard/events/${parsed.data.eventId}/roosters`)
}

export async function deleteEntryAction(
  _prev: EntryActionState,
  formData: FormData
): Promise<EntryActionState> {
  const profile = await requirePermission('entries.manage')

  const parsed = deleteEntrySchema.safeParse({
    eventId: formData.get('eventId'),
    entryId: formData.get('entryId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await deleteEntry(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateEntryPaths(parsed.data.eventId)
  redirect(`/dashboard/events/${parsed.data.eventId}/roosters`)
}

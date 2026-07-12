'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  getEntryFormEligibilityContext,
  toPolicyValidationContext,
} from '@/features/eligibility/registration-bridge'
import {
  createEntrySchema,
  deleteEntrySchema,
  updateEntryRosterItemSchema,
  updateEntrySchema,
  type UpdateEntryRosterItemInput,
} from '@/features/entries/schema'
import { validateRoosterAgainstPolicy } from '@/features/entries/policy-validation'
import {
  createEntryWithRooster,
  deleteEntry,
  updateEntry,
  updateEntryRoosters,
} from '@/features/entries/service'
import { getPairedRosterIdsForEntry } from '@/features/entries/queries'
import { requirePermission } from '@/lib/auth/permissions'

export type EntryActionState = { error?: string; success?: string }

function parseOptionalUuid(value: FormDataEntryValue | null): string | null {
  if (value == null || value.toString().trim() === '') return null
  return value.toString()
}

function parseOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (value == null || value.toString().trim() === '') return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

function parseRoosterPolicyFields(formData: FormData, prefix = '') {
  const field = (name: string) => formData.get(`${prefix}${name}`)
  return {
    ageClass: field('ageClass')?.toString().trim() || undefined,
    originType: field('originType')?.toString().trim() || undefined,
    breedingRelationship: field('breedingRelationship')?.toString().trim() || undefined,
    experienceStatus: field('experienceStatus')?.toString().trim() || undefined,
    bandLevel: field('bandLevel')?.toString().trim() || undefined,
    bandOrganization: field('bandOrganization')?.toString().trim() || undefined,
    bandYear: parseOptionalNumber(field('bandYear')),
    bandSeason: field('bandSeason')?.toString().trim() || undefined,
  }
}

function parseRosterUpdates(
  formData: FormData,
  pairedIds: Set<string>
): UpdateEntryRosterItemInput[] {
  const roosterIds =
    formData
      .get('roosterIds')
      ?.toString()
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean) ?? []

  const updates: UpdateEntryRosterItemInput[] = []

  for (const roosterId of roosterIds) {
    if (pairedIds.has(roosterId)) continue

    const parsed = updateEntryRosterItemSchema.safeParse({
      roosterId,
      bandNumber: formData.get(`bandNumber_${roosterId}`),
      weight: formData.get(`weight_${roosterId}`),
      category: formData.get(`category_${roosterId}`)?.toString().trim() || undefined,
      colorMarking: formData.get(`colorMarking_${roosterId}`)?.toString().trim() || undefined,
      ageClass: formData.get(`ageClass_${roosterId}`)?.toString().trim() || undefined,
      originType: formData.get(`originType_${roosterId}`)?.toString().trim() || undefined,
      breedingRelationship:
        formData.get(`breedingRelationship_${roosterId}`)?.toString().trim() || undefined,
      experienceStatus:
        formData.get(`experienceStatus_${roosterId}`)?.toString().trim() || undefined,
      bandLevel: formData.get(`bandLevel_${roosterId}`)?.toString().trim() || undefined,
      bandOrganization:
        formData.get(`bandOrganization_${roosterId}`)?.toString().trim() || undefined,
      bandYear: parseOptionalNumber(formData.get(`bandYear_${roosterId}`)),
      bandSeason: formData.get(`bandSeason_${roosterId}`)?.toString().trim() || undefined,
    })

    if (parsed.success) {
      updates.push(parsed.data)
    }
  }

  return updates
}

function revalidateEntryPaths(eventId: string) {
  revalidatePath(`/dashboard/events/${eventId}/rooster-entries`)
  revalidatePath(`/dashboard/events/${eventId}/matching`)
  revalidatePath(`/dashboard/events/${eventId}/reports/weighing`)
}

export async function createEntryAction(
  _prev: EntryActionState,
  formData: FormData
): Promise<EntryActionState> {
  const profile = await requirePermission('entries.manage')

  const parsed = createEntrySchema.safeParse({
    eventId: formData.get('eventId'),
    referredByPromoterId: parseOptionalUuid(formData.get('referredByPromoterId')),
    competitorId: parseOptionalUuid(formData.get('competitorId')),
    saveOwner: formData.get('saveOwner') === 'on',
    entryName: formData.get('entryName'),
    ownerName: formData.get('ownerName'),
    handlerName: formData.get('handlerName')?.toString().trim() || undefined,
    contactNumber: formData.get('contactNumber')?.toString().trim() || undefined,
    email: formData.get('email')?.toString().trim() || undefined,
    address: formData.get('address')?.toString().trim() || undefined,
    entrySource: formData.get('entrySource')?.toString() ?? 'staff_encoded',
    notes: formData.get('notes')?.toString().trim() || undefined,
    bandNumber: formData.get('bandNumber'),
    weight: formData.get('weight'),
    category: formData.get('category')?.toString().trim() || undefined,
    colorMarking: formData.get('colorMarking')?.toString().trim() || undefined,
    ...parseRoosterPolicyFields(formData),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const eligibilityContext = await getEntryFormEligibilityContext(parsed.data.eventId)
  if (eligibilityContext) {
    const policyError = validateRoosterAgainstPolicy(
      {
        weight: parsed.data.weight,
        ageClass: parsed.data.ageClass,
        category: parsed.data.category,
        originType: parsed.data.originType,
        breedingRelationship: parsed.data.breedingRelationship,
        experienceStatus: parsed.data.experienceStatus,
        bandLevel: parsed.data.bandLevel,
        bandOrganization: parsed.data.bandOrganization,
        bandYear: parsed.data.bandYear,
        bandSeason: parsed.data.bandSeason,
      },
      toPolicyValidationContext(eligibilityContext)
    )
    if (policyError) return { error: policyError }
  }

  const result = await createEntryWithRooster(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateEntryPaths(parsed.data.eventId)
  redirect(`/dashboard/events/${parsed.data.eventId}/rooster-entries`)
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
    saveOwner: formData.get('saveOwner') === 'on',
    entryName: formData.get('entryName'),
    ownerName: formData.get('ownerName'),
    handlerName: formData.get('handlerName')?.toString().trim() || undefined,
    contactNumber: formData.get('contactNumber')?.toString().trim() || undefined,
    email: formData.get('email')?.toString().trim() || undefined,
    address: formData.get('address')?.toString().trim() || undefined,
    entrySource: formData.get('entrySource')?.toString() ?? 'staff_encoded',
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const entryResult = await updateEntry(profile.id, parsed.data)
  if (entryResult.error) return { error: entryResult.error }

  const pairedIds = await getPairedRosterIdsForEntry(parsed.data.eventId, parsed.data.entryId)
  const rosterUpdates = parseRosterUpdates(formData, pairedIds)

  const eligibilityContext = await getEntryFormEligibilityContext(parsed.data.eventId)
  if (eligibilityContext) {
    const policyContext = toPolicyValidationContext(eligibilityContext)
    for (const rooster of rosterUpdates) {
      const policyError = validateRoosterAgainstPolicy(
        {
          weight: rooster.weight,
          ageClass: rooster.ageClass,
          category: rooster.category,
          originType: rooster.originType,
          breedingRelationship: rooster.breedingRelationship,
          experienceStatus: rooster.experienceStatus,
          bandLevel: rooster.bandLevel,
          bandOrganization: rooster.bandOrganization,
          bandYear: rooster.bandYear,
          bandSeason: rooster.bandSeason,
        },
        policyContext
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

  revalidateEntryPaths(parsed.data.eventId)
  revalidatePath(
    `/dashboard/events/${parsed.data.eventId}/rooster-entries/${parsed.data.entryId}/edit`
  )
  redirect(`/dashboard/events/${parsed.data.eventId}/rooster-entries`)
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
  redirect(`/dashboard/events/${parsed.data.eventId}/rooster-entries`)
}

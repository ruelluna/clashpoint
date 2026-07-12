'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  createEntrySchema,
  deleteEntrySchema,
  updateEntryRosterItemSchema,
  updateEntrySchema,
  type UpdateEntryRosterItemInput,
} from '@/features/entries/schema'
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
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
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

  const rosterResult = await updateEntryRoosters(
    profile.id,
    parsed.data.eventId,
    parsed.data.entryId,
    rosterUpdates
  )
  if (roosterResult.error) return { error: rosterResult.error }

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

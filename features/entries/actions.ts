'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createEntrySchema } from '@/features/entries/schema'
import { createEntry } from '@/features/entries/service'
import { requirePermission } from '@/lib/auth/permissions'

export type EntryActionState = { error?: string; success?: string }

function parseOptionalUuid(value: FormDataEntryValue | null): string | null {
  if (value == null || value.toString().trim() === '') return null
  return value.toString()
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
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await createEntry(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/registrations`)
  redirect(`/dashboard/events/${parsed.data.eventId}/registrations`)
}

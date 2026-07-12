'use server'

import { revalidatePath } from 'next/cache'

import {
  createRoosterSchema,
  recordWeightSchema,
  verifyWeightSchema,
} from '@/features/weighing/schema'
import { createRoosterForEntry, recordWeight, verifyWeight } from '@/features/weighing/service'
import { requirePermission } from '@/lib/auth/permissions'

export type WeighingActionState = { error?: string; success?: string }

export async function createRoosterAction(
  _prev: WeighingActionState,
  formData: FormData
): Promise<WeighingActionState> {
  const profile = await requirePermission('entries.manage')

  const parsed = createRoosterSchema.safeParse({
    eventId: formData.get('eventId'),
    entryId: formData.get('entryId'),
    bandNumber: formData.get('bandNumber'),
    weight: formData.get('weight'),
    category: formData.get('category')?.toString().trim() || undefined,
    colorMarking: formData.get('colorMarking')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid rooster details' }
  }

  const result = await createRoosterForEntry(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  const eventId = parsed.data.eventId
  revalidatePath(`/dashboard/events/${eventId}/rooster-entries`)
  revalidatePath(`/dashboard/events/${eventId}/matching`)
  revalidatePath(`/dashboard/events/${eventId}/reports/weighing`)
  revalidatePath('/dashboard/audit')

  return { success: 'Rooster added with weight' }
}

export async function recordWeightAction(
  _prev: WeighingActionState,
  formData: FormData
): Promise<WeighingActionState> {
  const profile = await requirePermission('entries.manage')

  const parsed = recordWeightSchema.safeParse({
    eventId: formData.get('eventId'),
    roosterRecordId: formData.get('roosterRecordId'),
    officialWeight: formData.get('officialWeight'),
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid weight' }
  }

  const result = await recordWeight(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  const eventId = parsed.data.eventId
  revalidatePath(`/dashboard/events/${eventId}/rooster-entries`)
  revalidatePath(`/dashboard/events/${eventId}/reports/weighing`)
  revalidatePath('/dashboard/audit')

  return { success: 'Weight recorded' }
}

export async function verifyWeightAction(
  _prev: WeighingActionState,
  formData: FormData
): Promise<WeighingActionState> {
  const profile = await requirePermission('entries.manage')

  const parsed = verifyWeightSchema.safeParse({
    eventId: formData.get('eventId'),
    weighingId: formData.get('weighingId'),
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid verification' }
  }

  const result = await verifyWeight(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  const eventId = parsed.data.eventId
  revalidatePath(`/dashboard/events/${eventId}/rooster-entries`)
  revalidatePath(`/dashboard/events/${eventId}/reports/weighing`)
  revalidatePath('/dashboard/audit')

  return { success: 'Weight verified' }
}

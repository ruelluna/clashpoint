'use server'

import { redirect } from 'next/navigation'

import {
  createRoosterSchema,
  recordWeightSchema,
  verifyWeightSchema,
} from '@/features/weighing/schema'
import { createRoosterForEntry, recordWeight, verifyWeight } from '@/features/weighing/service'
import { revalidateEventRoostersPaths } from '@/features/event-roosters/revalidate'
import { getEvent } from '@/features/events/queries'
import { requireAnyPermission } from '@/lib/auth/permissions'

export type WeighingActionState = { error?: string; success?: string }

export async function createRoosterAction(
  _prev: WeighingActionState,
  formData: FormData
): Promise<WeighingActionState> {
  const profile = await requireAnyPermission([
    'cock_entry.manage',
    'entries.manage',
    'weighing.manage',
  ])

  const parsed = createRoosterSchema.safeParse({
    eventId: formData.get('eventId'),
    entryId: formData.get('entryId'),
    entryName: formData.get('entryName')?.toString().trim() || formData.get('bandNumber'),
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
  revalidateEventRoostersPaths(eventId)

  const event = await getEvent(eventId)
  if (event?.event_type === 'derby' && result.roosterId) {
    redirect(`/dashboard/events/${eventId}/roosters/${result.roosterId}/print`)
  }

  return { success: 'Rooster added' }
}

export async function recordWeightAction(
  _prev: WeighingActionState,
  formData: FormData
): Promise<WeighingActionState> {
  const profile = await requireAnyPermission([
    'weighing.record',
    'cock_entry.manage',
    'entries.manage',
  ])

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

  revalidateEventRoostersPaths(parsed.data.eventId)

  return { success: 'Weight recorded' }
}

export async function verifyWeightAction(
  _prev: WeighingActionState,
  formData: FormData
): Promise<WeighingActionState> {
  const profile = await requireAnyPermission([
    'weighing.verify',
    'cock_entry.manage',
    'entries.manage',
  ])

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

  revalidateEventRoostersPaths(parsed.data.eventId)

  return { success: 'Weight verified' }
}

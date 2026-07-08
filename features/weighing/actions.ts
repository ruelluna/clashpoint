'use server'

import { revalidatePath } from 'next/cache'

import {
  recordWeightSchema,
  verifyWeightSchema,
} from '@/features/weighing/schema'
import { recordWeight, verifyWeight } from '@/features/weighing/service'
import { requirePermission } from '@/lib/auth/permissions'

export type WeighingActionState = { error?: string; success?: string }

export async function recordWeightAction(
  _prev: WeighingActionState,
  formData: FormData
): Promise<WeighingActionState> {
  const profile = await requirePermission('weighing.manage')

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
  revalidatePath(`/dashboard/events/${eventId}/weighing`)
  revalidatePath(`/dashboard/events/${eventId}/reports/weighing`)
  revalidatePath('/dashboard/audit')

  return { success: 'Weight recorded' }
}

export async function verifyWeightAction(
  _prev: WeighingActionState,
  formData: FormData
): Promise<WeighingActionState> {
  const profile = await requirePermission('weighing.manage')

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
  revalidatePath(`/dashboard/events/${eventId}/weighing`)
  revalidatePath(`/dashboard/events/${eventId}/reports/weighing`)
  revalidatePath('/dashboard/audit')

  return { success: 'Weight verified' }
}

'use server'

import { revalidatePath } from 'next/cache'

import { finalizeWinnersSchema } from '@/features/winners/schema'
import { finalizeWinners } from '@/features/winners/service'
import { requirePermission } from '@/lib/auth/permissions'

export type WinnersActionState = { error?: string; success?: string }

export async function finalizeWinnersAction(
  _prev: WinnersActionState,
  formData: FormData
): Promise<WinnersActionState> {
  const profile = await requirePermission('winners.manage')

  const parsed = finalizeWinnersSchema.safeParse({
    eventId: formData.get('eventId'),
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await finalizeWinners(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  const eventId = parsed.data.eventId
  revalidatePath(`/dashboard/events/${eventId}/winners`)
  revalidatePath(`/dashboard/events/${eventId}/payouts`)
  revalidatePath(`/dashboard/events/${eventId}/announcement`)
  revalidatePath('/dashboard/audit')
  return { success: 'Winners finalized and prize payouts generated' }
}

'use server'

import { revalidatePath } from 'next/cache'

import { recordPayoutSchema } from '@/features/payouts/schema'
import { recordPayout } from '@/features/payouts/service'
import { requirePermission } from '@/lib/auth/permissions'

export type PayoutActionState = { error?: string; success?: string }

export async function recordPayoutAction(
  _prev: PayoutActionState,
  formData: FormData
): Promise<PayoutActionState> {
  const profile = await requirePermission('payouts.manage')

  const parsed = recordPayoutSchema.safeParse({
    payoutId: formData.get('payoutId'),
    eventId: formData.get('eventId'),
    paymentMethod: formData.get('paymentMethod'),
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await recordPayout(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/payouts`)
  revalidatePath('/dashboard/audit')
  return { success: 'Payout recorded as released' }
}

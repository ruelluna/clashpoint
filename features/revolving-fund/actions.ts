'use server'

import { revalidatePath } from 'next/cache'

import { recordRevolvingFundAdjustment } from '@/features/revolving-fund/service'
import { recordRevolvingFundAdjustmentSchema } from '@/features/revolving-fund/schema'
import { requireNonStaffAnyPermission } from '@/lib/auth/permissions'

export type RevolvingFundActionState = { error?: string; success?: string }

export async function recordRevolvingFundAdjustmentAction(
  _prev: RevolvingFundActionState,
  formData: FormData
): Promise<RevolvingFundActionState> {
  const profile = await requireNonStaffAnyPermission(['events.manage'])

  const parsed = recordRevolvingFundAdjustmentSchema.safeParse({
    eventId: formData.get('eventId'),
    amount: formData.get('amount'),
    description: formData.get('description')?.toString().trim(),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await recordRevolvingFundAdjustment(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/revolving-fund`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}`)
  return { success: 'Adjustment recorded' }
}

'use server'

import { revalidatePath } from 'next/cache'

import {
  computeSettlementSchema,
  markSettledSchema,
} from '@/features/promoter-settlements/schema'
import {
  computeSettlement,
  markSettled,
} from '@/features/promoter-settlements/service'
import { requirePermission } from '@/lib/auth/permissions'

export type SettlementActionState = { error?: string; success?: string }

export async function computeSettlementAction(
  _prev: SettlementActionState,
  formData: FormData
): Promise<SettlementActionState> {
  const profile = await requirePermission('settlements.manage')

  const parsed = computeSettlementSchema.safeParse({
    eventId: formData.get('eventId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await computeSettlement(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/promoter-settlement`)
  revalidatePath('/dashboard/audit')
  return { success: 'Settlement computed and ready for review' }
}

export async function markSettledAction(
  _prev: SettlementActionState,
  formData: FormData
): Promise<SettlementActionState> {
  const profile = await requirePermission('settlements.manage')

  const parsed = markSettledSchema.safeParse({
    settlementId: formData.get('settlementId'),
    eventId: formData.get('eventId'),
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await markSettled(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/promoter-settlement`)
  revalidatePath('/dashboard/audit')
  return { success: 'Settlement marked as settled' }
}

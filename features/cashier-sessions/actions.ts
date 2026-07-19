'use server'

import { revalidatePath } from 'next/cache'

import {
  closeCashierSessionSchema,
  openCashierSessionSchema,
  recordAdminHandoverSchema,
} from '@/features/cashier-sessions/schema'
import {
  closeCashierSession,
  openCashierSession,
  recordAdminHandover,
} from '@/features/cashier-sessions/service'
import { requireOperationalPermission } from '@/lib/auth/permissions'

export type CashierSessionActionState = { error?: string; success?: string }

function revalidateCashierSessionPaths(eventId: string) {
  revalidatePath(`/dashboard/events/${eventId}/payments`)
  revalidatePath(`/dashboard/events/${eventId}/revolving-fund`)
  revalidatePath('/dashboard/transactions')
  revalidatePath('/dashboard/audit')
}

export async function openCashierSessionAction(
  _prev: CashierSessionActionState,
  formData: FormData
): Promise<CashierSessionActionState> {
  const profile = await requireOperationalPermission('payments.manage')

  const parsed = openCashierSessionSchema.safeParse({
    eventId: formData.get('eventId'),
    openingFloatAmount: formData.get('openingFloatAmount'),
    openingFloatDefault: formData.get('openingFloatDefault'),
    openingFloatNote: formData.get('openingFloatNote')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await openCashierSession(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateCashierSessionPaths(parsed.data.eventId)
  return { success: 'Cashier session opened' }
}

export async function closeCashierSessionAction(
  _prev: CashierSessionActionState,
  formData: FormData
): Promise<CashierSessionActionState> {
  const profile = await requireOperationalPermission('payments.manage')

  const closingCountedCash = formData.get('closingCountedCash')?.toString().trim()
  const parsed = closeCashierSessionSchema.safeParse({
    eventId: formData.get('eventId'),
    sessionId: formData.get('sessionId'),
    closingCountedCash: closingCountedCash ? closingCountedCash : undefined,
    closingNotes: formData.get('closingNotes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await closeCashierSession(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateCashierSessionPaths(parsed.data.eventId)
  return { success: 'Cashier session ended' }
}

export async function recordAdminHandoverAction(
  _prev: CashierSessionActionState,
  formData: FormData
): Promise<CashierSessionActionState> {
  const profile = await requireOperationalPermission('payments.manage')

  const parsed = recordAdminHandoverSchema.safeParse({
    eventId: formData.get('eventId'),
    sessionId: formData.get('sessionId'),
    amount: formData.get('amount'),
    description: formData.get('description')?.toString().trim(),
    adminUserId: formData.get('adminUserId')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await recordAdminHandover(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateCashierSessionPaths(parsed.data.eventId)
  return { success: 'Admin handover recorded' }
}

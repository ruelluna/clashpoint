'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  recordPaymentSchema,
  refundPaymentSchema,
} from '@/features/payments/schema'
import {
  getCashierTargetByEntryId,
  recordPayment,
  refundPayment,
  resolveCashierTarget,
} from '@/features/payments/service'
import type { CashierLookupResult, CashierTargetMatch } from '@/features/payments/types'
import { requirePermission } from '@/lib/auth/permissions'

export type PaymentActionState = { error?: string; success?: string }

export type CashierLookupActionResult = CashierLookupResult

export async function lookupCashierTargetAction(
  eventId: string,
  query: string
): Promise<CashierLookupActionResult> {
  await requirePermission('payments.manage')
  return resolveCashierTarget(eventId, query)
}

export async function getCashierDuesAction(
  eventId: string,
  entryId: string
): Promise<{ error?: string; match?: CashierTargetMatch }> {
  await requirePermission('payments.manage')
  return getCashierTargetByEntryId(eventId, entryId)
}

function revalidateCashierPaths(eventId: string) {
  revalidatePath(`/dashboard/events/${eventId}/payments`)
  revalidatePath(`/dashboard/events/${eventId}/revolving-fund`)
  revalidatePath(`/dashboard/events/${eventId}/owners`)
  revalidatePath(`/dashboard/events/${eventId}/roosters`)
  revalidatePath('/dashboard/audit')
}

export async function recordPaymentAction(
  _prev: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const profile = await requirePermission('payments.manage')

  const parsed = recordPaymentSchema.safeParse({
    eventId: formData.get('eventId'),
    entryId: formData.get('entryId'),
    amountPaid: formData.get('amountPaid'),
    paymentMethod: formData.get('paymentMethod'),
    paymentCategory: formData.get('paymentCategory')?.toString() || undefined,
    receiptNumber: formData.get('receiptNumber')?.toString().trim() || undefined,
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await recordPayment(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateCashierPaths(parsed.data.eventId)

  if (result.paymentId) {
    redirect(`/dashboard/events/${parsed.data.eventId}/payments/${result.paymentId}/print`)
  }

  return { success: 'Payment recorded' }
}

export async function refundPaymentAction(
  _prev: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const profile = await requirePermission('payments.manage')

  const parsed = refundPaymentSchema.safeParse({
    paymentId: formData.get('paymentId'),
    eventId: formData.get('eventId'),
    reason: formData.get('reason'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await refundPayment(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateCashierPaths(parsed.data.eventId)
  return { success: 'Payment refunded' }
}

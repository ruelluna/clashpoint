'use server'

import { revalidatePath } from 'next/cache'

import { requireOpenCashierSession } from '@/features/cashier-sessions/service'
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
import { requireOperationalPermission, requirePermission } from '@/lib/auth/permissions'

export type PaymentActionState = {
  error?: string
  success?: string
  paymentId?: string
<<<<<<< HEAD
  changeGiven?: number
=======
<<<<<<< Updated upstream
=======
  paymentIds?: string[]
  paymentCategories?: string[]
  changeGiven?: number
>>>>>>> Stashed changes
>>>>>>> cashier-payment-category-updated
}

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
  revalidatePath('/dashboard/transactions')
  revalidatePath('/dashboard/audit')
}

export async function recordPaymentAction(
  _prev: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const profile = await requireOperationalPermission('payments.manage')

  const parsed = recordPaymentSchema.safeParse({
    eventId: formData.get('eventId'),
    entryId: formData.get('entryId'),
    amountPaid: formData.get('amountPaid'),
    amountTendered: formData.get('amountTendered'),
    paymentMethod: formData.get('paymentMethod'),
    paymentCategory: formData.get('paymentCategory')?.toString() || undefined,
    collectEntryFees: formData.get('collectEntryFees')?.toString() || undefined,
    receiptNumber: formData.get('receiptNumber')?.toString().trim() || undefined,
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const sessionResult = await requireOpenCashierSession(profile.id, parsed.data.eventId)
  if (sessionResult.error || !sessionResult.session) {
    return { error: sessionResult.error ?? 'Open a cashier session first' }
  }

  const result = await recordPayment(profile.id, parsed.data, sessionResult.session.id)
  if (result.error) return { error: result.error }

  revalidateCashierPaths(parsed.data.eventId)

  return {
    success: 'Payment recorded',
    paymentId: result.paymentId,
<<<<<<< HEAD
    changeGiven: parsed.data.changeGiven,
=======
<<<<<<< Updated upstream
=======
    paymentIds: result.paymentIds,
    paymentCategories: result.paymentCategories,
>>>>>>> Stashed changes
>>>>>>> cashier-payment-category-updated
  }
}

export async function refundPaymentAction(
  _prev: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const profile = await requireOperationalPermission('payments.manage')

  const parsed = refundPaymentSchema.safeParse({
    paymentId: formData.get('paymentId'),
    eventId: formData.get('eventId'),
    reason: formData.get('reason'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const sessionResult = await requireOpenCashierSession(profile.id, parsed.data.eventId)
  if (sessionResult.error || !sessionResult.session) {
    return { error: sessionResult.error ?? 'Open a cashier session first' }
  }

  const result = await refundPayment(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateCashierPaths(parsed.data.eventId)
  return { success: 'Payment refunded' }
}

'use server'

import { revalidatePath } from 'next/cache'

import { requireOpenCashierSession } from '@/features/cashier-sessions/service'
import {
  recordMatchBetPaymentSchema,
  recordPaymentSchema,
  refundPaymentSchema,
  refundSelectedPaymentsSchema,
} from '@/features/payments/schema'
import {
  getCashierTargetByEntryId,
  recordMatchBetPayment,
  recordPayment,
  refundPayment,
  refundSelectedPayments,
  resolveCashierTarget,
} from '@/features/payments/service'
import type { CashierLookupResult, CashierTargetMatch } from '@/features/payments/types'
import { requireOperationalPermission, requirePermission } from '@/lib/auth/permissions'

export type PaymentActionState = {
  error?: string
  success?: string
  paymentId?: string
  paymentIds?: string[]
  paymentCategories?: string[]
  collectionBatchId?: string
  refundBatchId?: string
  changeGiven?: number
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
  revalidatePath(`/dashboard/events/${eventId}/matching`)
  revalidatePath('/dashboard/fights')
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
    collectRegistrationDues:
      formData.get('collectRegistrationDues')?.toString() ||
      formData.get('collectEntryFees')?.toString() ||
      undefined,
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
    paymentIds: result.paymentIds,
    paymentCategories: result.paymentCategories,
    collectionBatchId: result.collectionBatchId,
    changeGiven: parsed.data.changeGiven,
  }
}

export async function recordMatchBetPaymentAction(
  _prev: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const profile = await requireOperationalPermission('payments.manage')

  const parsed = recordMatchBetPaymentSchema.safeParse({
    eventId: formData.get('eventId'),
    matchBetId: formData.get('matchBetId'),
    amountPaid: formData.get('amountPaid'),
    amountTendered: formData.get('amountTendered'),
    paymentMethod: formData.get('paymentMethod'),
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const sessionResult = await requireOpenCashierSession(profile.id, parsed.data.eventId)
  if (sessionResult.error || !sessionResult.session) {
    return { error: sessionResult.error ?? 'Open a cashier session first' }
  }

  const result = await recordMatchBetPayment(
    profile.id,
    parsed.data,
    sessionResult.session.id
  )
  if (result.error) return { error: result.error }

  revalidateCashierPaths(parsed.data.eventId)

  return {
    success: 'Palitada payment recorded',
    paymentId: result.paymentId,
    changeGiven: parsed.data.changeGiven,
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

export async function refundSelectedPaymentsAction(
  _prev: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const profile = await requireOperationalPermission('payments.manage')

  const paymentIds = formData
    .getAll('paymentIds')
    .map((value) => value.toString())
    .filter(Boolean)

  const parsed = refundSelectedPaymentsSchema.safeParse({
    eventId: formData.get('eventId'),
    reason: formData.get('reason'),
    paymentIds,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const sessionResult = await requireOpenCashierSession(profile.id, parsed.data.eventId)
  if (sessionResult.error || !sessionResult.session) {
    return { error: sessionResult.error ?? 'Open a cashier session first' }
  }

  const result = await refundSelectedPayments(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateCashierPaths(parsed.data.eventId)

  return {
    success: 'Refund recorded',
    refundBatchId: result.refundBatchId,
  }
}

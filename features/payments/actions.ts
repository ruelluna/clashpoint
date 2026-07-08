'use server'

import { revalidatePath } from 'next/cache'

import {
  recordPaymentSchema,
  refundPaymentSchema,
} from '@/features/payments/schema'
import { recordPayment, refundPayment } from '@/features/payments/service'
import { requirePermission } from '@/lib/auth/permissions'

export type PaymentActionState = { error?: string; success?: string }

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
    receiptNumber: formData.get('receiptNumber')?.toString().trim() || undefined,
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await recordPayment(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/payments`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/registrations`)
  revalidatePath('/dashboard/audit')
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

  revalidatePath(`/dashboard/events/${parsed.data.eventId}/payments`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/registrations`)
  revalidatePath('/dashboard/audit')
  return { success: 'Payment refunded' }
}

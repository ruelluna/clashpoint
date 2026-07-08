import { z } from 'zod'

import type { PaymentStatus } from '@/features/entries/types'

export const paymentMethodSchema = z.enum(['cash', 'bank_transfer', 'gcash', 'other'])

export const recordPaymentSchema = z.object({
  eventId: z.string().uuid(),
  entryId: z.string().uuid(),
  amountPaid: z.coerce.number().positive('Amount paid must be greater than zero'),
  paymentMethod: paymentMethodSchema,
  receiptNumber: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  notes: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
})

export const refundPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  eventId: z.string().uuid(),
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(500),
})

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>

export const PAYMENT_METHOD_LABELS: Record<
  z.infer<typeof paymentMethodSchema>,
  string
> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  gcash: 'GCash',
  other: 'Other',
}

export function calculateBalance(
  amountDue: number,
  totalPaid: number
): { balance: number; paymentStatus: PaymentStatus } {
  const balance = Math.max(0, Number((amountDue - totalPaid).toFixed(2)))

  if (totalPaid <= 0) {
    return { balance: Number(amountDue.toFixed(2)), paymentStatus: 'unpaid' }
  }

  if (balance <= 0) {
    return { balance: 0, paymentStatus: 'paid' }
  }

  return { balance, paymentStatus: 'partial' }
}

export function generatePaymentReference(eventId: string, sequence: number): string {
  const eventPrefix = eventId.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `PAY-${eventPrefix}-${String(sequence).padStart(4, '0')}`
}

export function getNextPaymentReference(
  eventId: string,
  existingReferences: string[]
): string {
  let max = 0
  const prefix = `PAY-${eventId.replace(/-/g, '').slice(0, 8).toUpperCase()}-`

  for (const reference of existingReferences) {
    if (!reference.startsWith(prefix)) continue
    const suffix = reference.slice(prefix.length)
    const parsed = Number.parseInt(suffix, 10)
    if (!Number.isNaN(parsed) && parsed > max) {
      max = parsed
    }
  }

  return generatePaymentReference(eventId, max + 1)
}

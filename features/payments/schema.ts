import { z } from 'zod'

import type { PaymentStatus } from '@/features/entries/types'
import { computeCashChange, roundMoney } from '@/features/payments/tender'

export const paymentMethodSchema = z.enum(['cash', 'bank_transfer', 'gcash', 'other'])

export const paymentCategorySchema = z.enum([
  'registration',
  'rooster_entry',
  'entry_fees',
  'cash_bond',
  'adjustment',
  'legacy',
])

export const recordPaymentSchema = z
  .object({
    eventId: z.string().uuid(),
    entryId: z.string().uuid(),
    amountPaid: z.coerce.number().positive('Amount to collect must be greater than zero'),
    amountTendered: z.coerce.number().nonnegative().optional(),
    paymentMethod: paymentMethodSchema,
    paymentCategory: paymentCategorySchema.optional().default('legacy'),
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
  .refine((data) => data.paymentMethod === 'cash', {
    message: 'Only cash payments are accepted',
    path: ['paymentMethod'],
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod !== 'cash') return

    if (data.amountTendered == null || Number.isNaN(data.amountTendered)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cash tendered is required for cash payments',
        path: ['amountTendered'],
      })
      return
    }

    const changeResult = computeCashChange(data.amountPaid, data.amountTendered)
    if (!changeResult.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: changeResult.error,
        path: ['amountTendered'],
      })
    }
  })
  .transform((data) => {
    const base = {
      eventId: data.eventId,
      entryId: data.entryId,
      amountPaid: data.amountPaid,
      paymentMethod: data.paymentMethod,
      paymentCategory: data.paymentCategory,
      notes: data.notes,
      receiptNumber: data.paymentMethod === 'cash' ? undefined : data.receiptNumber,
      amountTendered: undefined as number | undefined,
      changeGiven: undefined as number | undefined,
    }

    if (data.paymentMethod !== 'cash' || data.amountTendered == null) {
      return base
    }

    const changeResult = computeCashChange(data.amountPaid, data.amountTendered)
    if (!changeResult.ok) {
      return base
    }

    return {
      ...base,
      amountTendered: roundMoney(data.amountTendered),
      changeGiven: changeResult.changeGiven,
    }
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

export const PAYMENT_CATEGORY_LABELS: Record<
  z.infer<typeof paymentCategorySchema>,
  string
> = {
  registration: 'Registration fee',
  rooster_entry: 'Rooster entry fee',
  entry_fees: 'Registration & entry fees',
  cash_bond: 'Cash bond',
  adjustment: 'Fee adjustment',
  legacy: 'Combined (legacy)',
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

import { z } from 'zod'

export const payoutMethodSchema = z.enum(['cash', 'bank_transfer', 'gcash', 'other'])

export const recordPayoutSchema = z.object({
  payoutId: z.string().uuid(),
  eventId: z.string().uuid(),
  paymentMethod: payoutMethodSchema,
  notes: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
})

export type RecordPayoutInput = z.infer<typeof recordPayoutSchema>

export const PAYOUT_METHOD_LABELS: Record<z.infer<typeof payoutMethodSchema>, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  gcash: 'GCash',
  other: 'Other',
}

export function generatePayoutReference(eventId: string, sequence: number): string {
  const eventPrefix = eventId.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `PO-${eventPrefix}-${String(sequence).padStart(4, '0')}`
}

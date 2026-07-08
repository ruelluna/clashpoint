import { z } from 'zod'

export const settlementStatusSchema = z.enum([
  'pending',
  'for_review',
  'settled',
  'disputed',
  'cancelled',
])

export const computeSettlementSchema = z.object({
  eventId: z.string().uuid(),
})

export const markSettledSchema = z.object({
  settlementId: z.string().uuid(),
  eventId: z.string().uuid(),
  notes: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
})

export type ComputeSettlementInput = z.infer<typeof computeSettlementSchema>
export type MarkSettledInput = z.infer<typeof markSettledSchema>

export const SETTLEMENT_STATUS_LABELS: Record<
  z.infer<typeof settlementStatusSchema>,
  string
> = {
  pending: 'Pending',
  for_review: 'For review',
  settled: 'Settled',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
}

export function generateSettlementReference(
  eventId: string,
  sequence: number
): string {
  const eventPrefix = eventId.replace(/-/g, '').slice(0, 8).toUpperCase()
  return `STL-${eventPrefix}-${String(sequence).padStart(4, '0')}`
}

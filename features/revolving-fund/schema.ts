import { z } from 'zod'

export const recordRevolvingFundAdjustmentSchema = z.object({
  eventId: z.string().uuid(),
  amount: z.coerce
    .number()
    .refine((value) => value !== 0, 'Adjustment amount cannot be zero'),
  description: z.string().min(1, 'Description is required').max(500),
})

export type RecordRevolvingFundAdjustmentInput = z.infer<
  typeof recordRevolvingFundAdjustmentSchema
>

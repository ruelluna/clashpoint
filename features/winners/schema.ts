import { z } from 'zod'

export const finalizeWinnersSchema = z.object({
  eventId: z.string().uuid(),
  notes: z
    .string()
    .max(2000)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
})

export type FinalizeWinnersInput = z.infer<typeof finalizeWinnersSchema>

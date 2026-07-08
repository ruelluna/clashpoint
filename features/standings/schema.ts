import { z } from 'zod'

export const eventIdSchema = z.object({
  eventId: z.string().uuid('Invalid event'),
})

export type EventIdInput = z.infer<typeof eventIdSchema>

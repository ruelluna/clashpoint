import { z } from 'zod'

export const matchStatusSchema = z.enum([
  'draft',
  'for_review',
  'confirmed',
  'locked',
  'ready',
  'ongoing',
  'completed',
  'cancelled',
])

export const fightQueueStatusSchema = z.enum([
  'scheduled',
  'called',
  'ready',
  'ongoing',
])

export const createMatchSchema = z
  .object({
    eventId: z.string().uuid(),
    meronEntryId: z.string().uuid(),
    meronRoosterId: z.string().uuid(),
    walaEntryId: z.string().uuid(),
    walaRoosterId: z.string().uuid(),
    fightNumber: z.coerce.number().int().positive().optional(),
    roundNumber: z.coerce.number().int().positive().optional(),
    meronBet: z.coerce.number().nonnegative().optional(),
    walaBet: z.coerce.number().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.meronRoosterId === data.walaRoosterId) {
      ctx.addIssue({
        code: 'custom',
        message: 'A rooster cannot be matched against itself',
        path: ['walaRoosterId'],
      })
    }
  })

export const lockMatchListSchema = z.object({
  eventId: z.string().uuid(),
})

export const updateFightQueueStatusSchema = z.object({
  matchId: z.string().uuid(),
  queueStatus: fightQueueStatusSchema,
})

export const updateMatchStatusSchema = z.object({
  matchId: z.string().uuid(),
  status: matchStatusSchema,
})

export const updateMatchBetSchema = z.object({
  eventId: z.string().uuid(),
  matchId: z.string().uuid(),
  side: z.enum(['meron', 'wala']),
  amount: z.coerce.number().nonnegative('Bet amount cannot be negative'),
})

export type CreateMatchInput = z.infer<typeof createMatchSchema>
export type LockMatchListInput = z.infer<typeof lockMatchListSchema>
export type UpdateFightQueueStatusInput = z.infer<typeof updateFightQueueStatusSchema>
export type UpdateMatchStatusInput = z.infer<typeof updateMatchStatusSchema>
export type UpdateMatchBetInput = z.infer<typeof updateMatchBetSchema>

export const MATCH_STATUS_LABELS: Record<z.infer<typeof matchStatusSchema>, string> = {
  draft: 'Draft',
  for_review: 'For Review',
  confirmed: 'Confirmed',
  locked: 'Locked',
  ready: 'Ready',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const FIGHT_QUEUE_STATUS_LABELS: Record<
  z.infer<typeof fightQueueStatusSchema>,
  string
> = {
  scheduled: 'Scheduled',
  called: 'Called',
  ready: 'Ready',
  ongoing: 'Ongoing',
}

import { z } from 'zod'

export const matchStatusSchema = z.enum([
  'draft',
  'for_review',
  'confirmed',
  'queued',
  'at_pit',
  'fighting',
  'settling',
  'completed',
  'cancelled',
])

export const fightQueueStatusSchema = z.enum([
  'waiting',
  'handlers_called',
  'birds_at_pit',
  'fighting',
])

export const matchBetPaymentStatusSchema = z.enum([
  'unpaid',
  'paid',
  'refunded',
  'waived',
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
    meronBet: z.coerce
      .number()
      .positive('Meron pledge must be greater than zero'),
    walaBet: z.coerce.number().positive('Wala pledge must be greater than zero'),
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

export const updateMatchBetAmountsSchema = z
  .object({
    eventId: z.string().uuid(),
    matchId: z.string().uuid(),
    meronBet: z.coerce
      .number()
      .positive('Meron pledge must be greater than zero')
      .optional(),
    walaBet: z.coerce
      .number()
      .positive('Wala pledge must be greater than zero')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.meronBet == null && data.walaBet == null) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter at least one pledge amount to update',
        path: ['meronBet'],
      })
    }
  })

export const cancelMatchSchema = z.object({
  eventId: z.string().uuid(),
  matchId: z.string().uuid(),
})

export const palitadaContributorTypeSchema = z.enum(['vip', 'monton'])

export const fightSideSchema = z.enum(['meron', 'wala'])

export const addPalitadaContributionSchema = z.object({
  eventId: z.string().uuid(),
  matchId: z.string().uuid(),
  side: fightSideSchema,
  contributorName: z.string().trim().min(1, 'Contributor name is required').max(200),
  contributorType: palitadaContributorTypeSchema.default('vip'),
  amount: z.coerce.number().positive('Palitada amount must be greater than zero'),
})

export const deletePalitadaContributionSchema = z.object({
  eventId: z.string().uuid(),
  matchId: z.string().uuid(),
  contributionId: z.string().uuid(),
})

export const postMatchSettlementObligationSchema = z.object({
  eventId: z.string().uuid(),
  matchId: z.string().uuid(),
  obligationId: z.string().uuid(),
})

export const completeMatchSettlementSchema = z.object({
  eventId: z.string().uuid(),
  matchId: z.string().uuid(),
})

export const lookupRoosterForMatchingSchema = z.object({
  eventId: z.string().uuid(),
  barcode: z.string().min(1, 'Barcode is required'),
})

export type CreateMatchInput = z.infer<typeof createMatchSchema>
export type LockMatchListInput = z.infer<typeof lockMatchListSchema>
export type UpdateFightQueueStatusInput = z.infer<typeof updateFightQueueStatusSchema>
export type UpdateMatchStatusInput = z.infer<typeof updateMatchStatusSchema>
export type UpdateMatchBetAmountsInput = z.infer<typeof updateMatchBetAmountsSchema>
export type CancelMatchInput = z.infer<typeof cancelMatchSchema>
export type AddPalitadaContributionInput = z.infer<typeof addPalitadaContributionSchema>
export type DeletePalitadaContributionInput = z.infer<typeof deletePalitadaContributionSchema>
export type PostMatchSettlementObligationInput = z.infer<
  typeof postMatchSettlementObligationSchema
>
export type CompleteMatchSettlementInput = z.infer<typeof completeMatchSettlementSchema>
export type LookupRoosterForMatchingInput = z.infer<
  typeof lookupRoosterForMatchingSchema
>

export type MatchBetPaymentStatus = z.infer<typeof matchBetPaymentStatusSchema>

export const MATCH_STATUS_LABELS: Record<z.infer<typeof matchStatusSchema>, string> = {
  draft: 'Awaiting payment',
  for_review: 'For Review',
  confirmed: 'Confirmed',
  queued: 'In queue',
  at_pit: 'Birds at pit',
  fighting: 'Fighting',
  settling: 'Settling',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const FIGHT_QUEUE_STATUS_LABELS: Record<
  z.infer<typeof fightQueueStatusSchema>,
  string
> = {
  waiting: 'Waiting',
  handlers_called: 'Handlers called',
  birds_at_pit: 'Birds at pit',
  fighting: 'Fighting',
}

export const FIGHT_QUEUE_ADVANCE_ACTION_LABELS: Record<
  z.infer<typeof fightQueueStatusSchema>,
  string
> = {
  waiting: 'Add to queue',
  handlers_called: 'Call handlers',
  birds_at_pit: 'Birds at pit',
  fighting: 'Start fight',
}

export const MATCH_BET_PAYMENT_STATUS_LABELS: Record<MatchBetPaymentStatus, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  refunded: 'Refunded',
  waived: 'Waived',
}

export const FIGHT_SIDE_LABELS = {
  meron: 'Meron',
  wala: 'Wala',
} as const

export function formatMatchBetBarcode(
  eventId: string,
  fightNumber: number,
  side: 'meron' | 'wala'
): string {
  const prefix = eventId.replace(/-/g, '').slice(0, 8).toUpperCase()
  const sideCode = side === 'meron' ? 'M' : 'W'
  return `BET-${prefix}-${String(fightNumber).padStart(4, '0')}-${sideCode}`
}

export function normalizeMatchBetBarcodeInput(value: string): string {
  return value.trim().toUpperCase()
}

export function isMatchBetBarcodeForEvent(value: string, eventId: string): boolean {
  return parseMatchBetBarcode(value, eventId) != null
}

export function parseMatchBetBarcode(
  raw: string,
  eventId: string
): { fightNumber: number; side: 'meron' | 'wala' } | null {
  const value = normalizeMatchBetBarcodeInput(raw)
  const prefix = `BET-${eventId.replace(/-/g, '').slice(0, 8).toUpperCase()}-`
  if (!value.startsWith(prefix)) return null

  const suffix = value.slice(prefix.length)
  const match = /^(\d{4})-(M|W)$/.exec(suffix)
  if (!match) return null

  const fightNumber = Number.parseInt(match[1]!, 10)
  if (Number.isNaN(fightNumber) || fightNumber <= 0) return null

  return {
    fightNumber,
    side: match[2] === 'M' ? 'meron' : 'wala',
  }
}

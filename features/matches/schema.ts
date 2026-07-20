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
      .positive('Meron palitada must be greater than zero'),
    walaBet: z.coerce.number().positive('Wala palitada must be greater than zero'),
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

export const cancelMatchSchema = z.object({
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
export type CancelMatchInput = z.infer<typeof cancelMatchSchema>
export type LookupRoosterForMatchingInput = z.infer<
  typeof lookupRoosterForMatchingSchema
>

export type MatchBetPaymentStatus = z.infer<typeof matchBetPaymentStatusSchema>

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

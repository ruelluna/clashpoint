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
  direction: z.enum(['advance', 'rollback']).optional().default('advance'),
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

export const markVipSettlementPaidSchema = z.object({
  eventId: z.string().uuid(),
  matchId: z.string().uuid(),
  obligationId: z.string().uuid(),
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
export type MarkVipSettlementPaidInput = z.infer<typeof markVipSettlementPaidSchema>
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

export function formatMatchingNumberSuffix(sequence: number): string {
  return `-${String(sequence).padStart(4, '0')}`
}

const MATCHING_NUMBER_PATTERN = /^[A-Z]{4}-(\d{4})$/

export function parseMatchingNumberSequence(matchingNumber: string): number | null {
  const match = matchingNumber.trim().toUpperCase().match(MATCHING_NUMBER_PATTERN)
  if (!match) return null
  return Number.parseInt(match[1]!, 10)
}

export function nextMatchingNumberSequence(existing: (string | null)[]): number {
  let maxSequence = 0
  for (const matchingNumber of existing) {
    if (matchingNumber == null) continue
    const sequence = parseMatchingNumberSequence(matchingNumber)
    if (sequence != null && sequence > maxSequence) {
      maxSequence = sequence
    }
  }
  return maxSequence + 1
}

function randomMatchingLetters(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let letters = ''
  const bytes = new Uint8Array(4)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
    for (let index = 0; index < 4; index += 1) {
      letters += alphabet[bytes[index]! % 26]!
    }
  } else {
    for (let index = 0; index < 4; index += 1) {
      letters += alphabet[Math.floor(Math.random() * 26)]!
    }
  }
  return letters
}

export function formatMatchingNumber(letters: string, sequence: number): string {
  return `${letters}${formatMatchingNumberSuffix(sequence)}`
}

export function generateMatchingNumber(sequence: number): string {
  return formatMatchingNumber(randomMatchingLetters(), sequence)
}

export function formatMatchBetBarcode(
  eventId: string,
  fightNumber: number,
  side: 'meron' | 'wala'
): string {
  const prefix = eventId.replace(/-/g, '').slice(0, 8).toUpperCase()
  const sideCode = side === 'meron' ? 'M' : 'W'
  return `BET-${prefix}-${String(fightNumber).padStart(4, '0')}-${sideCode}`
}

export function formatMatchBetScanCode(
  fightNumber: number,
  side: 'meron' | 'wala'
): string {
  const sideCode = side === 'meron' ? 'M' : 'W'
  return `B${String(fightNumber).padStart(4, '0')}${sideCode}`
}

export function matchBetScanCodeFromCanonical(barcode: string): string | null {
  const match = /^BET-[A-Z0-9]{8}-(\d{4})-(M|W)$/i.exec(barcode.trim())
  if (!match) return null
  return formatMatchBetScanCode(
    Number.parseInt(match[1]!, 10),
    match[2]!.toUpperCase() === 'M' ? 'meron' : 'wala'
  )
}

export function resolveMatchBetScanCode(
  barcode: string | null | undefined,
  scanCode?: string | null
): string | null {
  if (scanCode?.trim()) return normalizeMatchBetBarcodeInput(scanCode)
  if (!barcode) return null
  return matchBetScanCodeFromCanonical(barcode)
}

export function normalizeMatchBetBarcodeInput(value: string): string {
  return value.trim().toUpperCase()
}

export function parseMatchBetScanCode(
  raw: string
): { fightNumber: number; side: 'meron' | 'wala' } | null {
  const value = normalizeMatchBetBarcodeInput(raw)
  const match = /^B(\d{4})(M|W)$/.exec(value)
  if (!match) return null

  const fightNumber = Number.parseInt(match[1]!, 10)
  if (Number.isNaN(fightNumber) || fightNumber <= 0) return null

  return {
    fightNumber,
    side: match[2] === 'M' ? 'meron' : 'wala',
  }
}

export function isMatchBetScanCode(value: string): boolean {
  return parseMatchBetScanCode(value) != null
}

export function isMatchBetBarcodeForEvent(value: string, eventId: string): boolean {
  return parseMatchBetBarcode(value, eventId) != null
}

export function parseMatchBetBarcode(
  raw: string,
  eventId: string
): { fightNumber: number; side: 'meron' | 'wala' } | null {
  const value = normalizeMatchBetBarcodeInput(raw)
  const fromScan = parseMatchBetScanCode(value)
  if (fromScan != null) return fromScan

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

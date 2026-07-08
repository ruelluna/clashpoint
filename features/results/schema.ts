import { z } from 'zod'

export const fightResultTypeSchema = z.enum([
  'meron_win',
  'wala_win',
  'draw',
  'no_contest',
  'disqualification',
  'cancelled',
])

export const resultStatusSchema = z.enum([
  'draft',
  'submitted',
  'verified',
  'final',
])

export const recordResultSchema = z.object({
  matchId: z.string().uuid('Invalid match'),
  eventId: z.string().uuid('Invalid event'),
  resultType: fightResultTypeSchema,
  notes: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  underProtest: z.boolean().optional().default(false),
})

export const verifyResultSchema = z.object({
  resultId: z.string().uuid('Invalid result'),
  eventId: z.string().uuid('Invalid event'),
})

export type RecordResultInput = z.infer<typeof recordResultSchema>
export type VerifyResultInput = z.infer<typeof verifyResultSchema>

export const FIGHT_RESULT_TYPE_LABELS: Record<
  z.infer<typeof fightResultTypeSchema>,
  string
> = {
  meron_win: 'Meron win',
  wala_win: 'Wala win',
  draw: 'Draw',
  no_contest: 'No contest',
  disqualification: 'Disqualification',
  cancelled: 'Cancelled',
}

export const RESULT_STATUS_LABELS: Record<
  z.infer<typeof resultStatusSchema>,
  string
> = {
  draft: 'Draft',
  submitted: 'Submitted',
  verified: 'Verified',
  final: 'Final',
}

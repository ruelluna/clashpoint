import { z } from 'zod'

import type { LineupStatus } from '@/features/lineups/types'

export const lineupStatusSchema = z.enum([
  'draft',
  'submitted',
  'verified',
  'rejected',
])

export const lineupCockSchema = z.object({
  cockNumber: z.coerce.number().int().positive('Cock number must be at least 1'),
  bandNumber: z.string().min(1, 'Band number is required').max(50),
  declaredWeight: z.coerce.number().positive().nullable().optional(),
  category: z
    .string()
    .max(100)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
  colorMarking: z
    .string()
    .max(200)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
})

export const submitLineupSchema = z
  .object({
    eventId: z.string().uuid(),
    entryId: z.string().uuid(),
    cocks: z.array(lineupCockSchema).min(1, 'At least one cock is required'),
  })
  .superRefine((data, ctx) => {
    const cockNumbers = data.cocks.map((cock) => cock.cockNumber)
    const bandNumbers = data.cocks.map((cock) => cock.bandNumber.trim().toLowerCase())

    const duplicateCock = cockNumbers.find(
      (num, index) => cockNumbers.indexOf(num) !== index
    )
    if (duplicateCock != null) {
      ctx.addIssue({
        code: 'custom',
        message: `Duplicate cock number ${duplicateCock}`,
        path: ['cocks'],
      })
    }

    const duplicateBand = data.cocks.find((cock, index) => {
      const normalized = cock.bandNumber.trim().toLowerCase()
      return bandNumbers.indexOf(normalized) !== index
    })
    if (duplicateBand) {
      ctx.addIssue({
        code: 'custom',
        message: `Duplicate band number ${duplicateBand.bandNumber}`,
        path: ['cocks'],
      })
    }
  })

export type SubmitLineupInput = z.infer<typeof submitLineupSchema>
export type LineupCockInput = z.infer<typeof lineupCockSchema>

export const LINEUP_STATUS_LABELS: Record<LineupStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  verified: 'Verified',
  rejected: 'Rejected',
}

export function validateCockCount(
  cockCount: number,
  cocksPerEntry: number
): string | null {
  if (cockCount !== cocksPerEntry) {
    return `Lineup must include exactly ${cocksPerEntry} cocks (received ${cockCount})`
  }
  return null
}

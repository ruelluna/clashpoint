import { z } from 'zod'

import { bandLevelSchema } from '@/lib/derby/enums'

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined)

export const createBandSchema = z.object({
  roosterId: z.string().uuid(),
  bandLevel: bandLevelSchema.default('other'),
  bandOrganization: optionalText(200),
  bandNumber: z.string().trim().min(1, 'Band number is required').max(100),
  bandYear: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  bandSeason: optionalText(50),
  bandLocation: optionalText(50),
  bandColor: optionalText(50),
  proofAttachment: optionalText(500),
})

export const verifyBandSchema = z.object({
  bandId: z.string().uuid(),
  verificationNotes: optionalText(2000),
})

export const rejectBandSchema = z.object({
  bandId: z.string().uuid(),
  verificationNotes: z.string().trim().min(3).max(2000),
})

export const checkDuplicateBandSchema = z.object({
  bandOrganization: optionalText(200),
  bandNumber: z.string().trim().min(1).max(100),
  bandYear: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
  bandSeason: optionalText(50),
  excludeBandId: z.string().uuid().optional(),
})

export type CreateBandInput = z.infer<typeof createBandSchema>
export type VerifyBandInput = z.infer<typeof verifyBandSchema>
export type RejectBandInput = z.infer<typeof rejectBandSchema>
export type CheckDuplicateBandInput = z.infer<typeof checkDuplicateBandSchema>

export function normalizeBandNumber(bandNumber: string): string {
  return bandNumber.trim().toUpperCase()
}

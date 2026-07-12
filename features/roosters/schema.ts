import { z } from 'zod'

import {
  ageClassSchema,
  breedingRelationshipSchema,
  competitionClassSchema,
  experienceStatusSchema,
  originTypeSchema,
} from '@/lib/derby/enums'

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined)

export const createRoosterSchema = z.object({
  name: optionalText(200),
  competitorId: z.string().uuid().nullable().optional(),
  gamefarmId: z.string().uuid().nullable().optional(),
  breederId: z.string().uuid().nullable().optional(),
  ageClass: ageClassSchema.default('unknown'),
  hatchDate: z.string().date().nullable().optional(),
  hatchDateIsEstimated: z.boolean().default(false),
  competitionClass: competitionClassSchema.default('unclassified'),
  breed: optionalText(100),
  bloodline: optionalText(200),
  declaredExternalExperienceStatus: experienceStatusSchema.nullable().optional(),
  originType: originTypeSchema.default('unknown'),
  countryOfOrigin: optionalText(100),
  provinceOfOrigin: optionalText(100),
  municipalityOfOrigin: optionalText(100),
  breederNameExternal: optionalText(200),
  breedingRelationship: breedingRelationshipSchema.default('unknown'),
  originNotes: optionalText(2000),
})

export const updateRoosterSchema = createRoosterSchema.extend({
  roosterId: z.string().uuid(),
})

export type CreateRoosterInput = z.infer<typeof createRoosterSchema>
export type UpdateRoosterInput = z.infer<typeof updateRoosterSchema>

export function formatRoosterCode(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error('Rooster code sequence must be a positive integer')
  }
  return `CP-R-${String(sequence).padStart(5, '0')}`
}

export function parseRoosterCodeSequence(roosterCode: string): number | null {
  const match = /^CP-R-(\d+)$/i.exec(roosterCode.trim())
  if (!match) return null
  const parsed = Number.parseInt(match[1], 10)
  return Number.isNaN(parsed) ? null : parsed
}

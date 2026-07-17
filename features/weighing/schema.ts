import { z } from 'zod'

import {
  buildRoosterEntryItemSchema,
  entryRoosterRegistryFieldsSchema,
  roosterColorMarkingSchema,
  weightGramsSchema,
} from '@/features/entries/schema'
import type { WeightStatus } from '@/features/weighing/types'

export const weightStatusSchema = z.enum([
  'pending',
  'passed',
  'failed',
  'for_review',
])

export const inspectionWeightGramsSchema = weightGramsSchema.max(
  10000,
  'Weight cannot exceed 10000 g'
)

export const recordWeightSchema = z.object({
  eventId: z.string().uuid(),
  roosterRecordId: z.string().uuid(),
  officialWeight: z.coerce.number().positive('Weight must be greater than zero'),
  notes: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
})

export const recordInspectionWeightSchema = z.object({
  eventId: z.string().uuid(),
  roosterRecordId: z.string().uuid(),
  officialWeightGrams: inspectionWeightGramsSchema,
  notes: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
})

export const verifyWeightSchema = z.object({
  eventId: z.string().uuid(),
  weighingId: z.string().uuid(),
  notes: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined),
})

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .or(z.literal(''))
    .transform((value) => value || undefined)

const requiredText = (max: number, message: string) =>
  z
    .string()
    .min(1, message)
    .max(max, `Must be at most ${max} characters`)

export function buildCreateRoosterSchema(bandingRequired: boolean) {
  return z
    .object({
      eventId: z.string().uuid(),
      entryId: z.string().uuid(),
      entryName: requiredText(200, 'Rooster name is required'),
      bandNumber: bandingRequired
        ? z.string().min(1, 'Band number is required').max(50)
        : z
            .string()
            .max(50)
            .optional()
            .or(z.literal(''))
            .transform((value) => value?.trim() || undefined),
      weight: z.preprocess(
        (value) =>
          value === '' || value === null || value === undefined ? undefined : value,
        weightGramsSchema.optional()
      ),
      breed: requiredText(100, 'Breed is required'),
      colorMarking: roosterColorMarkingSchema,
      handlerName: optionalText(200),
      notes: requiredText(2000, 'Notes are required'),
    })
    .extend(entryRoosterRegistryFieldsSchema)
}

export const createRoosterSchema = buildCreateRoosterSchema(true)
export type RecordWeightInput = z.infer<typeof recordWeightSchema>
export type RecordInspectionWeightInput = z.infer<typeof recordInspectionWeightSchema>
export type VerifyWeightInput = z.infer<typeof verifyWeightSchema>
export type CreateRoosterInput = z.infer<typeof createRoosterSchema>

export const WEIGHT_STATUS_LABELS: Record<WeightStatus, string> = {
  pending: 'Pending',
  passed: 'Passed',
  failed: 'Failed',
  for_review: 'For review',
}

export function evaluateWeightStatusGrams(
  weightGrams: number,
  minWeightGrams: number | null,
  maxWeightGrams: number | null
): 'passed' | 'failed' {
  if (minWeightGrams != null && weightGrams < minWeightGrams) return 'failed'
  if (maxWeightGrams != null && weightGrams > maxWeightGrams) return 'failed'
  return 'passed'
}

/** @deprecated Use evaluateWeightStatusGrams — weight values are stored in grams */
export function evaluateWeightStatus(
  weight: number,
  minWeight: number | null,
  maxWeight: number | null
): 'passed' | 'failed' {
  if (minWeight != null && weight < minWeight) return 'failed'
  if (maxWeight != null && weight > maxWeight) return 'failed'
  return 'passed'
}

export function validateCockCount(count: number, expected: number): string | null {
  if (count < 1) return 'At least one cock is required'
  if (count > expected) {
    return `This event allows at most ${expected} cock(s) per entry`
  }
  return null
}

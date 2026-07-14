import { z } from 'zod'

import { entryRoosterRegistryFieldsSchema } from '@/features/entries/schema'
import { weightGramsSchema } from '@/features/entries/schema'
import type { WeightStatus } from '@/features/weighing/types'

export const weightStatusSchema = z.enum([
  'pending',
  'passed',
  'failed',
  'for_review',
])

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

export const createRoosterSchema = z
  .object({
    eventId: z.string().uuid(),
    entryId: z.string().uuid(),
    entryName: optionalText(200),
    bandNumber: z.string().min(1, 'Band number is required').max(50),
    weight: z.preprocess(
      (value) =>
        value === '' || value === null || value === undefined ? undefined : value,
      weightGramsSchema.optional()
    ),
    colorMarking: optionalText(200),
    notes: optionalText(2000),
  })
  .extend(entryRoosterRegistryFieldsSchema)

export type RecordWeightInput = z.infer<typeof recordWeightSchema>
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

import { z } from 'zod'

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

export type RecordWeightInput = z.infer<typeof recordWeightSchema>
export type VerifyWeightInput = z.infer<typeof verifyWeightSchema>

export const WEIGHT_STATUS_LABELS: Record<WeightStatus, string> = {
  pending: 'Pending',
  passed: 'Passed',
  failed: 'Failed',
  for_review: 'For review',
}

export function evaluateWeightStatus(
  weight: number,
  minWeight: number | null,
  maxWeight: number | null
): 'passed' | 'failed' {
  if (minWeight != null && weight < minWeight) return 'failed'
  if (maxWeight != null && weight > maxWeight) return 'failed'
  return 'passed'
}

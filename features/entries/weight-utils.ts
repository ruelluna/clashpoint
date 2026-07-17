import type { EventRow } from '@/features/events/types'
import { kgToGrams } from '@/lib/derby/enums'

export function resolveEventWeightLimitsGrams(event: Pick<
  EventRow,
  'min_weight_grams' | 'max_weight_grams' | 'min_weight' | 'max_weight'
>): { minWeightGrams: number | null; maxWeightGrams: number | null } {
  return {
    minWeightGrams:
      event.min_weight_grams ??
      (event.min_weight != null ? kgToGrams(event.min_weight) : null),
    maxWeightGrams:
      event.max_weight_grams ??
      (event.max_weight != null ? kgToGrams(event.max_weight) : null),
  }
}

export function resolveStoredWeightGrams(
  weightGrams: number | null | undefined,
  weightKg: number | null | undefined
): number | null {
  if (weightGrams != null) return Number(weightGrams)
  if (weightKg != null) return Math.round(Number(weightKg) * 1000)
  return null
}

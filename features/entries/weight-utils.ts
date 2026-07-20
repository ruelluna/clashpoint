import type { EventRow } from '@/features/events/types'
import {
  isEligibilityFieldEnabled,
  parseEligibilityFieldKeys,
} from '@/lib/derby/eligibility-fields'
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

export type EffectiveWeightPolicyInput = {
  enabled_eligibility_fields?: string[] | null
  minimum_weight_grams?: number | null
  maximum_weight_grams?: number | null
} | null

export function resolveEffectiveWeightLimitsGrams(
  event: Pick<
    EventRow,
    'min_weight_grams' | 'max_weight_grams' | 'min_weight' | 'max_weight'
  >,
  policy?: EffectiveWeightPolicyInput
): { minWeightGrams: number | null; maxWeightGrams: number | null } {
  const eventLimits = resolveEventWeightLimitsGrams(event)
  if (!policy) return eventLimits

  const enabledFields = parseEligibilityFieldKeys(policy.enabled_eligibility_fields ?? [])
  const weightEnabled = isEligibilityFieldEnabled(enabledFields, 'weight')

  return {
    minWeightGrams:
      weightEnabled && policy.minimum_weight_grams != null
        ? policy.minimum_weight_grams
        : eventLimits.minWeightGrams,
    maxWeightGrams:
      weightEnabled && policy.maximum_weight_grams != null
        ? policy.maximum_weight_grams
        : eventLimits.maxWeightGrams,
  }
}

export function formatWeightLimitsLabel(
  minWeightGrams: number | null,
  maxWeightGrams: number | null
): string {
  if (minWeightGrams != null && maxWeightGrams != null) {
    return `Limits: ${minWeightGrams}–${maxWeightGrams} g`
  }
  if (minWeightGrams != null) {
    return `Minimum: ${minWeightGrams} g`
  }
  if (maxWeightGrams != null) {
    return `Maximum: ${maxWeightGrams} g`
  }
  return 'No weight limits configured'
}

export function resolveStoredWeightGrams(
  weightGrams: number | null | undefined,
  weightKg: number | null | undefined
): number | null {
  if (weightGrams != null) return Number(weightGrams)
  if (weightKg != null) return Math.round(Number(weightKg) * 1000)
  return null
}

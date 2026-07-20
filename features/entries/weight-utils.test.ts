import { describe, expect, it } from 'vitest'

import {
  formatWeightLimitsLabel,
  resolveEffectiveWeightLimitsGrams,
  resolveEventWeightLimitsGrams,
} from '@/features/entries/weight-utils'
import { evaluateWeightStatusGrams } from '@/features/weighing/schema'

describe('resolveEffectiveWeightLimitsGrams', () => {
  const eventWithLimits = {
    min_weight_grams: 1700,
    max_weight_grams: 2200,
    min_weight: null,
    max_weight: null,
  }

  it('uses policy limits when weight field is enabled', () => {
    const result = resolveEffectiveWeightLimitsGrams(eventWithLimits, {
      enabled_eligibility_fields: ['weight'],
      minimum_weight_grams: 1000,
      maximum_weight_grams: 1500,
    })

    expect(result).toEqual({ minWeightGrams: 1000, maxWeightGrams: 1500 })
  })

  it('falls back to event limits when policy is missing', () => {
    expect(resolveEffectiveWeightLimitsGrams(eventWithLimits)).toEqual({
      minWeightGrams: 1700,
      maxWeightGrams: 2200,
    })
  })

  it('falls back to event limits when weight field is disabled in policy', () => {
    const result = resolveEffectiveWeightLimitsGrams(eventWithLimits, {
      enabled_eligibility_fields: ['age_class'],
      minimum_weight_grams: 1000,
      maximum_weight_grams: 1500,
    })

    expect(result).toEqual({ minWeightGrams: 1700, maxWeightGrams: 2200 })
  })

  it('falls back to event limits when policy min/max are null', () => {
    const result = resolveEffectiveWeightLimitsGrams(eventWithLimits, {
      enabled_eligibility_fields: ['weight'],
      minimum_weight_grams: null,
      maximum_weight_grams: null,
    })

    expect(result).toEqual({ minWeightGrams: 1700, maxWeightGrams: 2200 })
  })
})

describe('resolveEventWeightLimitsGrams', () => {
  it('prefers gram columns over legacy kg columns', () => {
    expect(
      resolveEventWeightLimitsGrams({
        min_weight_grams: 1000,
        max_weight_grams: 1500,
        min_weight: 2,
        max_weight: 3,
      })
    ).toEqual({ minWeightGrams: 1000, maxWeightGrams: 1500 })
  })
})

describe('formatWeightLimitsLabel', () => {
  it('formats min and max range', () => {
    expect(formatWeightLimitsLabel(1000, 1500)).toBe('Limits: 1000–1500 g')
  })

  it('handles missing limits', () => {
    expect(formatWeightLimitsLabel(null, null)).toBe('No weight limits configured')
  })
})

describe('evaluateWeightStatusGrams with effective limits', () => {
  it('fails 2000 g against 1000–1500 g limits', () => {
    const { minWeightGrams, maxWeightGrams } = resolveEffectiveWeightLimitsGrams(
      { min_weight_grams: null, max_weight_grams: null, min_weight: null, max_weight: null },
      {
        enabled_eligibility_fields: ['weight'],
        minimum_weight_grams: 1000,
        maximum_weight_grams: 1500,
      }
    )

    expect(evaluateWeightStatusGrams(2000, minWeightGrams, maxWeightGrams)).toBe('failed')
    expect(evaluateWeightStatusGrams(1200, minWeightGrams, maxWeightGrams)).toBe('passed')
  })
})

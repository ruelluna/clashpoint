import { describe, expect, it } from 'vitest'

import { formatEligibilityErrors } from '@/features/eligibility/format-errors'
import type { DerbyEligibilityEvaluation } from '@/features/eligibility/types'
import {
  validateRoosterAgainstPolicy,
  type RoosterPolicyValidationContext,
} from '@/features/entries/policy-validation'

const baseContext: RoosterPolicyValidationContext = {
  enabledFields: ['age_class', 'weight'],
  unknownValueHandling: 'prohibit',
  allowedAgeClasses: ['stag', 'cock'],
  minimumWeightGrams: 1700,
  maximumWeightGrams: 2200,
  bandingRequired: false,
  acceptedBandLevels: [],
  acceptedBandOrganizations: [],
  acceptedBandYears: [],
  acceptedBandSeasons: [],
}

describe('formatEligibilityErrors', () => {
  it('joins failed check messages', () => {
    const evaluation: DerbyEligibilityEvaluation = {
      status: 'ineligible',
      checks: [
        {
          check: 'age',
          outcome: 'fail',
          passed: false,
          message: 'Age class stag is not allowed for this event',
        },
        {
          check: 'weight',
          outcome: 'pass',
          passed: true,
          message: 'Weight is within limits',
        },
      ],
      rejectionCategories: ['age_ineligible'],
      canMatch: false,
      evaluatedAt: new Date().toISOString(),
    }

    expect(formatEligibilityErrors(evaluation)).toBe(
      'Age class stag is not allowed for this event'
    )
  })
})

describe('validateRoosterAgainstPolicy', () => {
  it('rejects weight below policy minimum', () => {
    const error = validateRoosterAgainstPolicy(
      { weight: 1.5, ageClass: 'stag' },
      baseContext
    )
    expect(error).toBe('Weight is below the event minimum.')
  })

  it('rejects disallowed age class when unknown is prohibited', () => {
    const error = validateRoosterAgainstPolicy(
      { weight: 2.0 },
      baseContext
    )
    expect(error).toBe('Age class is required for this event.')
  })

  it('accepts rooster matching enabled policy rules', () => {
    const error = validateRoosterAgainstPolicy(
      { weight: 2.0, ageClass: 'stag' },
      baseContext
    )
    expect(error).toBeNull()
  })

  it('skips validation when no policy context', () => {
    expect(validateRoosterAgainstPolicy({ weight: 0.5 }, null)).toBeNull()
  })
})

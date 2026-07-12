import { describe, expect, it } from 'vitest'

import { validateRoosterAgainstPolicy } from '@/features/entries/policy-validation'

describe('entry policy validation', () => {
  it('requires band level when banding is required', () => {
    const error = validateRoosterAgainstPolicy(
      { weight: 2.0, ageClass: 'cock' },
      {
        enabledFields: ['banding'],
        unknownValueHandling: 'approval_required',
        allowedAgeClasses: ['cock'],
        minimumWeightGrams: null,
        maximumWeightGrams: null,
        bandingRequired: true,
        acceptedBandLevels: ['national'],
        acceptedBandOrganizations: [],
        acceptedBandYears: [],
        acceptedBandSeasons: [],
      }
    )

    expect(error).toBe('Band level is required for this event.')
  })
})

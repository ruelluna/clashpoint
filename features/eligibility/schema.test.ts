import { describe, expect, it } from 'vitest'

import { upsertEligibilityPolicySchema } from '@/features/eligibility/schema'
import {
  isEligibilityFieldEnabled,
  parseEligibilityFieldKeys,
} from '@/lib/derby/eligibility-fields'

const TEST_EVENT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

describe('parseEligibilityFieldKeys', () => {
  it('keeps only supported field keys', () => {
    expect(parseEligibilityFieldKeys(['banding', 'invalid', 'experience'])).toEqual([
      'banding',
      'experience',
    ])
  })
})

describe('isEligibilityFieldEnabled', () => {
  it('returns false when no fields are enabled', () => {
    expect(isEligibilityFieldEnabled([], 'banding')).toBe(false)
    expect(isEligibilityFieldEnabled(null, 'banding')).toBe(false)
  })

  it('returns true when the field is enabled', () => {
    expect(isEligibilityFieldEnabled(['banding', 'weight'], 'banding')).toBe(true)
  })
})

describe('upsertEligibilityPolicySchema', () => {
  it('requires age class options when age rules are enabled', () => {
    const result = upsertEligibilityPolicySchema.safeParse({
      eventId: TEST_EVENT_ID,
      enabledFields: ['age_class'],
      allowedAgeClasses: [],
    })

    expect(result.success).toBe(false)
  })

  it('accepts banding options when banding is enabled', () => {
    const result = upsertEligibilityPolicySchema.safeParse({
      eventId: TEST_EVENT_ID,
      enabledFields: ['banding'],
      acceptedBandLevels: ['national', 'local'],
      acceptedBandOrganizations: ['NGBA'],
      acceptedBandYears: [2026],
      acceptedBandSeasons: ['Spring 2026'],
    })

    expect(result.success).toBe(true)
  })

  it('requires experience options when experience rules are enabled', () => {
    const result = upsertEligibilityPolicySchema.safeParse({
      eventId: TEST_EVENT_ID,
      enabledFields: ['experience'],
      allowedExperienceStatuses: [],
    })

    expect(result.success).toBe(false)
  })
})

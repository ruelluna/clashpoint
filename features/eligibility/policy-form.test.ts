import { describe, expect, it } from 'vitest'

import {
  hasEligibilityPolicyFormData,
  parseEligibilityPolicyFormData,
} from '@/features/eligibility/policy-form'

const TEST_EVENT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

function buildFormData(entries: Record<string, string | string[]>): FormData {
  const formData = new FormData()
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, item)
      }
    } else {
      formData.append(key, value)
    }
  }
  return formData
}

describe('hasEligibilityPolicyFormData', () => {
  it('returns false when no eligibility fields are submitted', () => {
    const formData = buildFormData({ name: 'Test Derby' })
    expect(hasEligibilityPolicyFormData(formData)).toBe(false)
  })

  it('returns true when enabled fields are submitted', () => {
    const formData = buildFormData({ enabledFields: ['banding'] })
    expect(hasEligibilityPolicyFormData(formData)).toBe(true)
  })

  it('returns true when enforcement is enabled', () => {
    const formData = buildFormData({ eligibilityEnforcementEnabled: 'on' })
    expect(hasEligibilityPolicyFormData(formData)).toBe(true)
  })
})

describe('parseEligibilityPolicyFormData', () => {
  it('accepts an empty optional policy when no fields are enabled', () => {
    const formData = buildFormData({
      eventId: TEST_EVENT_ID,
      policyStatus: 'draft',
      eligibilityEnforcementEnabled: 'off',
    })

    const result = parseEligibilityPolicyFormData(formData)

    expect(result.error).toBeUndefined()
    expect(result.data?.eventId).toBe(TEST_EVENT_ID)
    expect(result.data?.enabledFields).toEqual([])
    expect(result.data?.eligibilityEnforcementEnabled).toBe(false)
  })

  it('uses an explicit eventId override on create', () => {
    const formData = buildFormData({
      policyStatus: 'draft',
      enabledFields: ['banding'],
      acceptedBandLevels: ['national'],
      acceptedBandOrganizations: ['NGBA'],
      acceptedBandYears: ['2026'],
      acceptedBandSeasons: ['Spring 2026'],
    })

    const result = parseEligibilityPolicyFormData(formData, TEST_EVENT_ID)

    expect(result.error).toBeUndefined()
    expect(result.data?.eventId).toBe(TEST_EVENT_ID)
    expect(result.data?.enabledFields).toEqual(['banding'])
  })

  it('returns a validation error when enabled fields are missing required options', () => {
    const formData = buildFormData({
      eventId: TEST_EVENT_ID,
      enabledFields: ['age_class'],
    })

    const result = parseEligibilityPolicyFormData(formData)

    expect(result.error).toBeDefined()
    expect(result.data).toBeUndefined()
  })
})

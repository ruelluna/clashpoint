import { describe, expect, it } from 'vitest'

import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'
import {
  buildEligibilityPolicySummary,
  hasEligibilityOptionsConfigured,
} from '@/features/eligibility/policy-summary'

const baseContext: EntryFormEligibilityContext = {
  eligibilityEnforcementEnabled: true,
  enabledFields: ['age_class', 'weight'],
  unknownValueHandling: 'prohibit',
  allowedAgeClasses: [
    { value: 'stag', label: 'Stag' },
    { value: 'cock', label: 'Cock' },
  ],
  minimumWeightGrams: 1800,
  maximumWeightGrams: 2300,
  weightVerificationRequired: true,
  bandingRequired: false,
  allowUnbanded: true,
  acceptedBandLevels: [],
  acceptedBandOrganizations: [],
  acceptedBandYears: [],
  acceptedBandSeasons: [],
  allowedExperienceStatuses: [],
  allowedOriginTypes: [],
  allowedBreedingRelationships: [],
  associationMembersOnly: false,
  physicalInspectionRequired: false,
  documentVerificationRequired: false,
  entryFeePaymentRequired: false,
}

describe('buildEligibilityPolicySummary', () => {
  it('builds summary items for enabled fields with configured options and entry fields', () => {
    const summary = buildEligibilityPolicySummary(baseContext, null)

    expect(summary.enforcementEnabled).toBe(true)
    expect(summary.items).toHaveLength(2)
    expect(summary.items[0]?.field).toBe('age_class')
    expect(summary.items[0]?.configuredOptions[0]).toContain('Stag')
    expect(summary.items[0]?.entryFieldsToFill[0]).toContain('required')
    expect(summary.items[1]?.field).toBe('weight')
    expect(summary.items[1]?.configuredOptions[0]).toContain('1.8')
    expect(summary.items[1]?.configuredOptions[1]).toContain('verification')
  })

  it('adds workflow notes when physical inspection is enabled on the event', () => {
    const context: EntryFormEligibilityContext = {
      ...baseContext,
      enabledFields: [],
      physicalInspectionRequired: true,
    }

    const summary = buildEligibilityPolicySummary(context, null)

    expect(summary.workflowNotes).toContain('Physical inspection required')
  })
})

describe('hasEligibilityOptionsConfigured', () => {
  it('returns true when enabled fields exist', () => {
    expect(hasEligibilityOptionsConfigured(baseContext)).toBe(true)
  })

  it('returns false when context is null or has no enabled fields', () => {
    expect(hasEligibilityOptionsConfigured(null)).toBe(false)
    expect(
      hasEligibilityOptionsConfigured({
        ...baseContext,
        enabledFields: [],
      })
    ).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'

import { isRoosterRegistrationMatchable } from '@/features/compatibility/matchability'

describe('isRoosterRegistrationMatchable', () => {
  const base = {
    registrationStatus: 'approved' as const,
    approvalStatus: 'approved',
    eligibilityStatus: 'eligible',
    weightVerified: true,
    weightVerificationRequired: true,
    inspectionStatus: 'passed',
    physicalInspectionRequired: false,
    regPaymentStatus: 'paid',
    entryFeePaymentRequired: false,
    conditionallyApprovedMatchHandling: 'exclude' as const,
  }

  it('approved registration becomes matchable when requirements pass', () => {
    expect(isRoosterRegistrationMatchable(base).matchable).toBe(true)
  })

  it('submitted registration cannot be matched', () => {
    const result = isRoosterRegistrationMatchable({
      ...base,
      registrationStatus: 'submitted',
    })
    expect(result.matchable).toBe(false)
  })

  it('rejected registration cannot be matched', () => {
    const result = isRoosterRegistrationMatchable({
      ...base,
      approvalStatus: 'rejected',
    })
    expect(result.matchable).toBe(false)
  })

  it('ineligible registration cannot be matched', () => {
    const result = isRoosterRegistrationMatchable({
      ...base,
      eligibilityStatus: 'ineligible',
    })
    expect(result.matchable).toBe(false)
  })

  it('conditionally approved excluded by default', () => {
    const result = isRoosterRegistrationMatchable({
      ...base,
      registrationStatus: 'conditionally_approved',
    })
    expect(result.matchable).toBe(false)
  })
})

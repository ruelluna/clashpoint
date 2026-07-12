import { describe, expect, it } from 'vitest'

import { evaluateWeightEligibility } from '@/features/eligibility/schema'

describe('evaluateWeightEligibility', () => {
  it('weight below minimum fails', () => {
    expect(evaluateWeightEligibility(1500, 1700, 2200)).toBe('fail')
  })

  it('weight above maximum fails', () => {
    expect(evaluateWeightEligibility(2500, 1700, 2200)).toBe('fail')
  })

  it('valid weight passes', () => {
    expect(evaluateWeightEligibility(2000, 1700, 2200)).toBe('pass')
  })

  it('missing official weight remains pending', () => {
    expect(evaluateWeightEligibility(null, 1700, 2200)).toBe('pending')
  })
})

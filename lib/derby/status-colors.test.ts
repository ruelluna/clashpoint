import { describe, expect, it } from 'vitest'

import {
  eligibilityStatusColorPalette,
  registrationWorkflowStatusColorPalette,
} from '@/lib/derby/status-colors'

describe('registrationWorkflowStatusColorPalette', () => {
  it('maps approved workflow statuses to green', () => {
    expect(registrationWorkflowStatusColorPalette('approved')).toBe('green')
    expect(registrationWorkflowStatusColorPalette('matched')).toBe('green')
  })

  it('maps conditionally approved to purple', () => {
    expect(registrationWorkflowStatusColorPalette('conditionally_approved')).toBe('purple')
  })

  it('maps rejected statuses to red', () => {
    expect(registrationWorkflowStatusColorPalette('rejected')).toBe('red')
    expect(registrationWorkflowStatusColorPalette('disqualified')).toBe('red')
  })
})

describe('eligibilityStatusColorPalette', () => {
  it('maps eligibility outcomes', () => {
    expect(eligibilityStatusColorPalette('eligible')).toBe('green')
    expect(eligibilityStatusColorPalette('ineligible')).toBe('red')
    expect(eligibilityStatusColorPalette('pending_review')).toBe('yellow')
  })
})

import { describe, expect, it } from 'vitest'

import {
  assertRegistrationTransition,
  canTransitionRegistrationStatus,
  resolveSubmitTargetStatus,
} from '@/features/registrations/workflow'

describe('registration workflow', () => {
  it('allows draft to move into pending review when approval is required', () => {
    const target = resolveSubmitTargetStatus({
      weightVerificationRequired: false,
      physicalInspectionRequired: false,
      documentVerificationRequired: false,
      bandVerificationRequired: false,
      requireRoosterEntryApproval: true,
    })

    expect(target).toBe('pending_review')
    expect(canTransitionRegistrationStatus('draft', target)).toBe(true)
  })

  it('blocks invalid transitions', () => {
    expect(assertRegistrationTransition('withdrawn', 'approved')).toBe(
      'Cannot transition registration from withdrawn to approved'
    )
  })

  it('prioritizes weighing before inspection when both are required on submit target', () => {
    const target = resolveSubmitTargetStatus({
      weightVerificationRequired: true,
      physicalInspectionRequired: true,
      documentVerificationRequired: false,
      bandVerificationRequired: false,
      requireRoosterEntryApproval: false,
    })

    expect(target).toBe('pending_weighing')
  })
})

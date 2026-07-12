import type {
  ConditionallyApprovedMatchHandling,
  RegistrationWorkflowStatus,
} from '@/lib/derby/enums'

import type { MatchabilityResult } from '@/features/compatibility/types'

const MATCHABLE_REGISTRATION_STATUSES = new Set<RegistrationWorkflowStatus>([
  'approved',
  'conditionally_approved',
  'matched',
])

export function isRoosterRegistrationMatchable(input: {
  registrationStatus: RegistrationWorkflowStatus
  approvalStatus: string
  eligibilityStatus: string
  weightVerified: boolean
  weightVerificationRequired: boolean
  inspectionStatus: string
  physicalInspectionRequired: boolean
  regPaymentStatus: string
  entryFeePaymentRequired: boolean
  conditionallyApprovedMatchHandling: ConditionallyApprovedMatchHandling
}): MatchabilityResult {
  const reasons: string[] = []

  if (!MATCHABLE_REGISTRATION_STATUSES.has(input.registrationStatus)) {
    reasons.push(`Registration status is ${input.registrationStatus}`)
  }

  if (input.approvalStatus === 'rejected' || input.approvalStatus === 'revoked') {
    reasons.push(`Approval status is ${input.approvalStatus}`)
  }

  if (input.eligibilityStatus === 'ineligible') {
    reasons.push('Registration is ineligible')
  }

  if (input.eligibilityStatus === 'pending_review') {
    reasons.push('Eligibility review is still pending')
  }

  if (
    input.registrationStatus === 'conditionally_approved' &&
    input.conditionallyApprovedMatchHandling === 'exclude'
  ) {
    reasons.push('Conditionally approved registrations are excluded from matching')
  }

  if (input.weightVerificationRequired && !input.weightVerified) {
    reasons.push('Weight verification is required')
  }

  if (input.physicalInspectionRequired && input.inspectionStatus !== 'passed') {
    reasons.push('Physical inspection must pass before matching')
  }

  if (input.entryFeePaymentRequired && input.regPaymentStatus !== 'paid') {
    reasons.push('Registration fee must be paid before matching')
  }

  return {
    matchable: reasons.length === 0,
    reasons,
  }
}

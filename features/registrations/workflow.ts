import type { RegistrationWorkflowStatus } from '@/lib/derby/enums'

export type RegistrationWorkflowRequirements = {
  weightVerificationRequired: boolean
  physicalInspectionRequired: boolean
  documentVerificationRequired: boolean
  bandVerificationRequired: boolean
  requireRoosterEntryApproval: boolean
}

export const REGISTRATION_WORKFLOW_TRANSITIONS: Record<
  RegistrationWorkflowStatus,
  RegistrationWorkflowStatus[]
> = {
  draft: [
    'submitted',
    'pending_review',
    'pending_weighing',
    'pending_inspection',
    'pending_documents',
    'pending_band_verification',
    'withdrawn',
  ],
  submitted: [
    'pending_review',
    'pending_weighing',
    'pending_inspection',
    'pending_documents',
    'pending_band_verification',
    'approved',
    'conditionally_approved',
    'rejected',
    'withdrawn',
  ],
  pending_review: [
    'pending_weighing',
    'pending_inspection',
    'pending_documents',
    'pending_band_verification',
    'approved',
    'conditionally_approved',
    'rejected',
    'withdrawn',
  ],
  pending_weighing: [
    'pending_inspection',
    'pending_documents',
    'pending_band_verification',
    'pending_review',
    'approved',
    'conditionally_approved',
    'rejected',
    'withdrawn',
  ],
  pending_inspection: [
    'pending_review',
    'pending_documents',
    'approved',
    'conditionally_approved',
    'rejected',
    'withdrawn',
  ],
  pending_documents: [
    'pending_review',
    'approved',
    'conditionally_approved',
    'rejected',
    'withdrawn',
  ],
  pending_band_verification: [
    'pending_review',
    'approved',
    'conditionally_approved',
    'rejected',
    'withdrawn',
  ],
  conditionally_approved: ['approved', 'rejected', 'withdrawn', 'disqualified'],
  approved: ['matched', 'withdrawn', 'disqualified'],
  rejected: ['draft'],
  withdrawn: [],
  disqualified: [],
  matched: ['completed', 'disqualified'],
  completed: [],
}

const TERMINAL_STATUSES = new Set<RegistrationWorkflowStatus>([
  'withdrawn',
  'disqualified',
  'completed',
])

export function canTransitionRegistrationStatus(
  from: RegistrationWorkflowStatus,
  to: RegistrationWorkflowStatus
): boolean {
  return REGISTRATION_WORKFLOW_TRANSITIONS[from].includes(to)
}

export function getAllowedRegistrationTransitions(
  status: RegistrationWorkflowStatus
): RegistrationWorkflowStatus[] {
  return REGISTRATION_WORKFLOW_TRANSITIONS[status]
}

export function isTerminalRegistrationStatus(
  status: RegistrationWorkflowStatus
): boolean {
  return TERMINAL_STATUSES.has(status)
}

export function resolveSubmitTargetStatus(
  requirements: RegistrationWorkflowRequirements
): RegistrationWorkflowStatus {
  if (requirements.requireRoosterEntryApproval) {
    return 'pending_review'
  }
  if (requirements.weightVerificationRequired) {
    return 'pending_weighing'
  }
  if (requirements.physicalInspectionRequired) {
    return 'pending_inspection'
  }
  if (requirements.documentVerificationRequired) {
    return 'pending_documents'
  }
  if (requirements.bandVerificationRequired) {
    return 'pending_band_verification'
  }
  return 'submitted'
}

export function resolvePostEligibilityTargetStatus(input: {
  current: RegistrationWorkflowStatus
  requirements: RegistrationWorkflowRequirements
  hasBlockingFailures: boolean
  hasPendingChecks: boolean
  allowConditionalApproval: boolean
}): RegistrationWorkflowStatus {
  if (input.hasBlockingFailures) {
    return 'rejected'
  }

  if (input.hasPendingChecks) {
    if (input.requirements.weightVerificationRequired && input.current !== 'pending_weighing') {
      return 'pending_weighing'
    }
    if (
      input.requirements.physicalInspectionRequired &&
      input.current !== 'pending_inspection'
    ) {
      return 'pending_inspection'
    }
    if (
      input.requirements.documentVerificationRequired &&
      input.current !== 'pending_documents'
    ) {
      return 'pending_documents'
    }
    if (
      input.requirements.bandVerificationRequired &&
      input.current !== 'pending_band_verification'
    ) {
      return 'pending_band_verification'
    }
    if (input.requirements.requireRoosterEntryApproval) {
      return 'pending_review'
    }
    return input.current
  }

  if (input.allowConditionalApproval && input.requirements.requireRoosterEntryApproval) {
    return 'pending_review'
  }

  return 'approved'
}

export function assertRegistrationTransition(
  from: RegistrationWorkflowStatus,
  to: RegistrationWorkflowStatus
): string | null {
  if (from === to) return null
  if (!canTransitionRegistrationStatus(from, to)) {
    return `Cannot transition registration from ${from} to ${to}`
  }
  return null
}

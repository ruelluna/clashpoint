import type { EligibilityStatus, PolicyStatus, RegistrationWorkflowStatus } from '@/lib/derby/enums'

export type StatusColorPalette =
  | 'gray'
  | 'blue'
  | 'orange'
  | 'green'
  | 'red'
  | 'purple'
  | 'yellow'
  | 'teal'

export function registrationWorkflowStatusColorPalette(
  status: RegistrationWorkflowStatus
): StatusColorPalette {
  switch (status) {
    case 'draft':
      return 'gray'
    case 'submitted':
    case 'pending_review':
    case 'pending_weighing':
    case 'pending_inspection':
    case 'pending_documents':
    case 'pending_band_verification':
      return 'orange'
    case 'conditionally_approved':
      return 'purple'
    case 'approved':
    case 'matched':
    case 'completed':
      return 'green'
    case 'rejected':
    case 'disqualified':
      return 'red'
    default:
      return 'blue'
  }
}

export function eligibilityStatusColorPalette(status: EligibilityStatus): StatusColorPalette {
  switch (status) {
    case 'eligible':
      return 'green'
    case 'conditionally_eligible':
      return 'orange'
    case 'pending_review':
      return 'yellow'
    case 'ineligible':
      return 'red'
    default:
      return 'gray'
  }
}

export function policyStatusColorPalette(status: PolicyStatus): StatusColorPalette {
  switch (status) {
    case 'draft':
      return 'gray'
    case 'active':
      return 'green'
    case 'locked':
      return 'purple'
    case 'archived':
      return 'orange'
    default:
      return 'gray'
  }
}

export function inspectionStatusColorPalette(
  status: 'not_required' | 'pending' | 'passed' | 'failed' | 'for_review'
): StatusColorPalette {
  if (status === 'passed') return 'green'
  if (status === 'failed') return 'red'
  if (status === 'for_review') return 'orange'
  return 'gray'
}

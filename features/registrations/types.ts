import type {
  EligibilityStatus,
  EntryRoosterRole,
  InspectionStatus,
  RegistrationPaymentStatus,
  RegistrationWorkflowStatus,
  RejectionCategory,
  RoosterApprovalStatus,
} from '@/lib/derby/enums'
import type { WeightStatus } from '@/features/weighing/types'

export type RoosterEventRegistrationRow = {
  id: string
  entry_id: string
  event_id: string
  registry_rooster_id: string | null
  cock_number: number
  band_number: string
  declared_weight: number | null
  category: string | null
  color_marking: string | null
  status: string
  entry_rooster_role: EntryRoosterRole
  registration_status: RegistrationWorkflowStatus
  approval_status: RoosterApprovalStatus
  eligibility_status: EligibilityStatus
  inspection_status: InspectionStatus
  reg_payment_status: RegistrationPaymentStatus
  eligibility_snapshot: Record<string, unknown> | null
  eligibility_checked_at: string | null
  eligibility_checked_by: string | null
  submitted_by: string | null
  submitted_at: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  approved_by: string | null
  approved_at: string | null
  approval_notes: string | null
  rejected_by: string | null
  rejected_at: string | null
  rejection_category: RejectionCategory | null
  rejection_reason: string | null
  eligibility_override_reason: string | null
  eligibility_override_approved_by: string | null
  eligibility_override_approved_at: string | null
  withdrawn_by: string | null
  withdrawn_at: string | null
  withdrawal_reason: string | null
  disqualified_by: string | null
  disqualified_at: string | null
  disqualification_reason: string | null
  conditional_approval_condition: string | null
  conditional_approval_deadline: string | null
  declared_weight_grams: number | null
  official_weight_grams: number | null
  weighed_at: string | null
  weighed_by: string | null
  weight_verified: boolean
  weight_verification_status: WeightStatus | null
  weight_notes: string | null
  created_at: string
  updated_at: string
}

export type RegistrationListItem = Pick<
  RoosterEventRegistrationRow,
  | 'id'
  | 'entry_id'
  | 'event_id'
  | 'registry_rooster_id'
  | 'cock_number'
  | 'band_number'
  | 'registration_status'
  | 'approval_status'
  | 'eligibility_status'
  | 'inspection_status'
  | 'reg_payment_status'
  | 'created_at'
> & {
  entry_number: string
  entry_name: string
  rooster_code: string | null
}

export type RegistrationWithRelations = RoosterEventRegistrationRow & {
  entry_number: string
  entry_name: string
  owner_name: string
  competitor_id: string | null
  entry_division: string
  rooster_code: string | null
  age_class: string | null
  competition_class: string | null
  calculated_experience_status: string | null
  origin_type: string | null
  breeding_relationship: string | null
}

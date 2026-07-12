import type {
  EligibilityStatus,
  RejectionCategory,
  UnknownValueHandling,
} from '@/lib/derby/enums'

export type EligibilityCheckName =
  | 'age'
  | 'weight'
  | 'banding'
  | 'experience'
  | 'origin'
  | 'association'
  | 'inspection'
  | 'payment'

export type EligibilityCheckOutcome = 'pass' | 'fail' | 'pending' | 'approval_required'

export type EligibilityCheckResult = {
  check: EligibilityCheckName
  outcome: EligibilityCheckOutcome
  passed: boolean
  message: string
  rejectionCategory?: RejectionCategory
}

export type DerbyEligibilityPolicy = {
  policy_status: string
  enabled_eligibility_fields: string[]
  allowed_age_classes: string[]
  minimum_weight_grams: number | null
  maximum_weight_grams: number | null
  weight_verification_required: boolean
  banding_required: boolean
  allow_unbanded: boolean
  accepted_band_levels: string[]
  accepted_band_organizations: string[]
  accepted_band_years: number[]
  accepted_band_seasons: string[]
  band_verification_required: boolean
  allowed_experience_statuses: string[]
  allowed_origin_types: string[]
  allowed_breeding_relationships: string[]
  association_members_only: boolean
  approved_association_ids: string[]
  locally_bred_only: boolean
  imported_allowed: boolean
  origin_verification_required: boolean
  physical_inspection_required: boolean
  document_verification_required: boolean
  entry_fee_payment_required: boolean
  unknown_value_handling: UnknownValueHandling
}

export type DerbyEligibilityEvaluation = {
  status: EligibilityStatus
  checks: EligibilityCheckResult[]
  rejectionCategories: RejectionCategory[]
  canMatch: boolean
  evaluatedAt: string
}

export type EligibilityEvaluationContext = {
  registrationId: string
  eventId: string
  ageClass: string | null
  officialWeightGrams: number | null
  declaredWeightGrams: number | null
  weightVerified: boolean
  weightVerificationStatus: string | null
  inspectionStatus: string
  regPaymentStatus: string
  experienceStatus: string | null
  originType: string | null
  breedingRelationship: string | null
  originVerified: boolean
  competitionClass: string | null
  competitorId: string | null
  bands: Array<{
    band_level: string
    band_organization: string | null
    band_number: string
    band_year: number | null
    band_season: string | null
    verification_status: string
  }>
  competitorAssociationIds: string[]
  eventAllowedAgeClasses: string[]
  eventMinWeightGrams: number | null
  eventMaxWeightGrams: number | null
  eventWeightVerificationRequired: boolean
  eventUnknownValueHandling: UnknownValueHandling
  policy: DerbyEligibilityPolicy | null
  eligibilityEnforcementEnabled: boolean
}

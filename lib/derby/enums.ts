import { z } from 'zod'

export const ageClassSchema = z.enum(['stag', 'bullstag', 'cock', 'unknown'])
export const competitionClassSchema = z.enum(['class_a', 'class_b', 'class_c', 'unclassified'])
export const experienceStatusSchema = z.enum([
  'maiden', 'one_time_winner', 'two_time_winner', 'multi_winner', 'winless', 'unknown',
])
export const competitorLevelSchema = z.enum([
  'novice', 'intermediate', 'advanced', 'veteran', 'unrated',
])
export const entryDivisionSchema = z.enum([
  'division_a', 'division_b', 'division_c', 'open', 'unassigned',
])
export const derbyAgeTypeSchema = z.enum([
  'stag_derby', 'bullstag_derby', 'cock_derby', 'stag_cock_derby',
  'cock_bullstag_derby', 'stag_bullstag_cock_combo', 'open_derby', 'custom',
])
export const derbyFormatSchema = z.enum(['2_cock', '3_cock', '4_cock', '5_cock', 'custom'])
export const registrationWorkflowStatusSchema = z.enum([
  'draft', 'submitted', 'pending_review', 'pending_weighing', 'pending_inspection',
  'pending_documents', 'pending_band_verification', 'conditionally_approved',
  'approved', 'rejected', 'withdrawn', 'disqualified', 'matched', 'completed',
])
export const roosterApprovalStatusSchema = z.enum([
  'not_submitted', 'pending', 'conditionally_approved', 'approved', 'rejected', 'revoked',
])
export const eligibilityStatusSchema = z.enum([
  'eligible', 'conditionally_eligible', 'pending_review', 'ineligible',
])
export const bandLevelSchema = z.enum([
  'national', 'local', 'association', 'personal_farm', 'unbanded', 'other',
])
export const bandVerificationStatusSchema = z.enum(['unverified', 'pending', 'verified', 'rejected'])
export const originTypeSchema = z.enum(['locally_bred', 'imported', 'unknown'])
export const breedingRelationshipSchema = z.enum([
  'owner_bred', 'member_bred', 'breeder_produced', 'farm_owned', 'externally_acquired', 'unknown',
])
export const entryRoosterRoleSchema = z.enum(['primary', 'reserve', 'substitute', 'joker', 'replacement'])
export const pairingStatusSchema = z.enum(['allowed', 'approval_required', 'prohibited'])
export const classificationTypeSchema = z.enum(['rooster_class', 'competitor_level', 'entry_division'])
export const unknownValueHandlingSchema = z.enum(['allow', 'approval_required', 'prohibit'])
export const policyStatusSchema = z.enum(['draft', 'active', 'locked', 'archived'])
export const rejectionCategorySchema = z.enum([
  'age_ineligible',
  'weight_below_minimum',
  'weight_above_maximum',
  'band_invalid',
  'band_unverified', 'duplicate_band', 'experience_ineligible', 'origin_ineligible',
  'association_requirement_failed', 'inspection_failed', 'missing_documents',
  'payment_incomplete', 'duplicate_registration', 'classification_incomplete',
  'promoter_rejection', 'other',
])
export const inspectionStatusSchema = z.enum(['not_required', 'pending', 'passed', 'failed', 'for_review'])
export const registrationPaymentStatusSchema = z.enum(['not_required', 'unpaid', 'partial', 'paid', 'refunded'])
export const conditionallyApprovedMatchHandlingSchema = z.enum([
  'exclude', 'include_with_warning', 'include_with_approval_required',
])
export const compatibilityStatusSchema = z.enum(['compatible', 'approval_required', 'prohibited'])

export type AgeClass = z.infer<typeof ageClassSchema>
export type CompetitionClass = z.infer<typeof competitionClassSchema>
export type ExperienceStatus = z.infer<typeof experienceStatusSchema>
export type CompetitorLevel = z.infer<typeof competitorLevelSchema>
export type EntryDivision = z.infer<typeof entryDivisionSchema>
export type DerbyAgeType = z.infer<typeof derbyAgeTypeSchema>
export type DerbyFormat = z.infer<typeof derbyFormatSchema>
export type RegistrationWorkflowStatus = z.infer<typeof registrationWorkflowStatusSchema>
export type RoosterApprovalStatus = z.infer<typeof roosterApprovalStatusSchema>
export type EligibilityStatus = z.infer<typeof eligibilityStatusSchema>
export type BandLevel = z.infer<typeof bandLevelSchema>
export type BandVerificationStatus = z.infer<typeof bandVerificationStatusSchema>
export type OriginType = z.infer<typeof originTypeSchema>
export type BreedingRelationship = z.infer<typeof breedingRelationshipSchema>
export type EntryRoosterRole = z.infer<typeof entryRoosterRoleSchema>
export type PairingStatus = z.infer<typeof pairingStatusSchema>
export type ClassificationType = z.infer<typeof classificationTypeSchema>
export type UnknownValueHandling = z.infer<typeof unknownValueHandlingSchema>
export type PolicyStatus = z.infer<typeof policyStatusSchema>
export type RejectionCategory = z.infer<typeof rejectionCategorySchema>
export type InspectionStatus = z.infer<typeof inspectionStatusSchema>
export type RegistrationPaymentStatus = z.infer<typeof registrationPaymentStatusSchema>
export type ConditionallyApprovedMatchHandling = z.infer<
  typeof conditionallyApprovedMatchHandlingSchema
>
export type CompatibilityStatus = z.infer<typeof compatibilityStatusSchema>

export const AGE_CLASS_LABELS: Record<AgeClass, string> = {
  stag: 'Stag',
  bullstag: 'Bullstag',
  cock: 'Cock',
  unknown: 'Unknown',
}

export const COMPETITION_CLASS_LABELS: Record<CompetitionClass, string> = {
  class_a: 'Class A',
  class_b: 'Class B',
  class_c: 'Class C',
  unclassified: 'Unclassified',
}

export const EXPERIENCE_STATUS_LABELS: Record<ExperienceStatus, string> = {
  maiden: 'Maiden',
  one_time_winner: '1x Winner',
  two_time_winner: '2x Winner',
  multi_winner: 'Multi-winner',
  winless: 'Winless',
  unknown: 'Unknown Record',
}

export const COMPETITOR_LEVEL_LABELS: Record<CompetitorLevel, string> = {
  novice: 'Novice',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  veteran: 'Veteran',
  unrated: 'Unrated',
}

export const ENTRY_DIVISION_LABELS: Record<EntryDivision, string> = {
  division_a: 'Division A',
  division_b: 'Division B',
  division_c: 'Division C',
  open: 'Open Division',
  unassigned: 'Unassigned',
}

export const DERBY_AGE_TYPE_LABELS: Record<DerbyAgeType, string> = {
  stag_derby: 'Stag Derby',
  bullstag_derby: 'Bullstag Derby',
  cock_derby: 'Cock Derby',
  stag_cock_derby: 'Stag/Cock Derby',
  cock_bullstag_derby: 'Cock/Bullstag Derby',
  stag_bullstag_cock_combo: 'Stag/Bullstag/Cock Combo Derby',
  open_derby: 'Open Derby',
  custom: 'Custom Derby',
}

export const DERBY_FORMAT_LABELS: Record<DerbyFormat, string> = {
  '2_cock': '2-Cock',
  '3_cock': '3-Cock',
  '4_cock': '4-Cock',
  '5_cock': '5-Cock',
  custom: 'Custom',
}

export const REGISTRATION_STATUS_LABELS: Record<RegistrationWorkflowStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  pending_review: 'Pending Review',
  pending_weighing: 'Pending Weighing',
  pending_inspection: 'Pending Inspection',
  pending_documents: 'Pending Documents',
  pending_band_verification: 'Pending Band Verification',
  conditionally_approved: 'Conditionally Approved',
  approved: 'Approved',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  disqualified: 'Disqualified',
  matched: 'Matched',
  completed: 'Completed',
}

export const APPROVAL_STATUS_LABELS: Record<RoosterApprovalStatus, string> = {
  not_submitted: 'Not Submitted',
  pending: 'Pending',
  conditionally_approved: 'Conditionally Approved',
  approved: 'Approved',
  rejected: 'Rejected',
  revoked: 'Revoked',
}

export const ELIGIBILITY_STATUS_LABELS: Record<EligibilityStatus, string> = {
  eligible: 'Eligible',
  conditionally_eligible: 'Conditionally Eligible',
  pending_review: 'Pending Review',
  ineligible: 'Ineligible',
}

export const PAIRING_STATUS_LABELS: Record<PairingStatus, string> = {
  allowed: 'Allowed',
  approval_required: 'Approval Required',
  prohibited: 'Prohibited',
}

export const COMPATIBILITY_STATUS_LABELS: Record<CompatibilityStatus, string> = {
  compatible: 'Compatible',
  approval_required: 'Approval Required',
  prohibited: 'Prohibited',
}

export const REJECTION_CATEGORY_LABELS: Record<RejectionCategory, string> = {
  age_ineligible: 'Age Ineligible',
  weight_below_minimum: 'Weight Below Minimum',
  weight_above_maximum: 'Weight Above Maximum',
  band_invalid: 'Band Invalid',
  band_unverified: 'Band Unverified',
  duplicate_band: 'Duplicate Band',
  experience_ineligible: 'Experience Ineligible',
  origin_ineligible: 'Origin Ineligible',
  association_requirement_failed: 'Association Requirement Failed',
  inspection_failed: 'Inspection Failed',
  missing_documents: 'Missing Documents',
  payment_incomplete: 'Payment Incomplete',
  duplicate_registration: 'Duplicate Registration',
  classification_incomplete: 'Classification Incomplete',
  promoter_rejection: 'Promoter Rejection',
  other: 'Other',
}

export function kgToGrams(kg: number): number {
  return Math.round(kg * 1000)
}

export function gramsToKg(grams: number | null | undefined): string {
  if (grams == null) return '—'
  return (grams / 1000).toFixed(2)
}

export function parseCategoryToAgeClass(category: string | null | undefined): AgeClass {
  const normalized = (category ?? '').trim().toLowerCase()
  if (normalized === 'stag') return 'stag'
  if (normalized === 'bullstag' || normalized === 'bull stag') return 'bullstag'
  if (normalized === 'cock') return 'cock'
  return 'unknown'
}

export const GENERIC_OVERRIDE_REASONS = new Set([
  'approved', 'okay', 'allowed', 'admin decision',
])

export function isMeaningfulOverrideReason(reason: string): boolean {
  const trimmed = reason.trim()
  if (trimmed.length < 10) return false
  return !GENERIC_OVERRIDE_REASONS.has(trimmed.toLowerCase())
}

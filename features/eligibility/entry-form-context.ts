import type { EligibilityFieldKey } from '@/lib/derby/eligibility-fields'
import type { UnknownValueHandling } from '@/lib/derby/enums'

export type EligibilityOptionPreset = {
  value: string
  label: string
}

export type EntryFormEligibilityContext = {
  eligibilityEnforcementEnabled: boolean
  enabledFields: EligibilityFieldKey[]
  unknownValueHandling: UnknownValueHandling
  allowedAgeClasses: EligibilityOptionPreset[]
  minimumWeightGrams: number | null
  maximumWeightGrams: number | null
  weightVerificationRequired: boolean
  bandingRequired: boolean
  allowUnbanded: boolean
  acceptedBandLevels: EligibilityOptionPreset[]
  acceptedBandOrganizations: string[]
  acceptedBandYears: number[]
  acceptedBandSeasons: string[]
  allowedExperienceStatuses: EligibilityOptionPreset[]
  allowedOriginTypes: EligibilityOptionPreset[]
  allowedBreedingRelationships: EligibilityOptionPreset[]
  associationMembersOnly: boolean
  physicalInspectionRequired: boolean
  documentVerificationRequired: boolean
  entryFeePaymentRequired: boolean
}

export type RoosterEligibilitySnapshot = {
  status: string
  checks: Array<{
    check: string
    outcome: string
    passed: boolean
    message: string
  }>
}

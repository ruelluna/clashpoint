import type { CompatibilityStatus } from '@/lib/derby/enums'

export type MatchabilityResult = {
  matchable: boolean
  reasons: string[]
}

export type CompatibilityRuleResult = {
  classificationType: string
  firstValue: string
  secondValue: string
  pairingStatus: string
  message: string
}

export type MatchCompatibilityEvaluation = {
  status: CompatibilityStatus
  reasons: string[]
  rules: CompatibilityRuleResult[]
  weightDifferenceGrams: number | null
  evaluatedAt: string
}

export type RegistrationMatchProfile = {
  registrationId: string
  entryId: string
  registryRoosterId: string | null
  competitorId: string | null
  gamefarmId: string | null
  registrationStatus: string
  approvalStatus: string
  eligibilityStatus: string
  inspectionStatus: string
  regPaymentStatus: string
  weightVerified: boolean
  competitionClass: string
  competitorLevel: string
  entryDivision: string
  officialWeightGrams: number | null
}

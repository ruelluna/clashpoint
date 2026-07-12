import 'server-only'

import { getPairingStatus } from '@/features/classification/service'
import { isRoosterRegistrationMatchable } from '@/features/compatibility/matchability'
import type {
  MatchCompatibilityEvaluation,
  RegistrationMatchProfile,
} from '@/features/compatibility/types'
import { getRegistrationWithRelations } from '@/features/registrations/queries'
import type {
  ClassificationType,
  CompatibilityStatus,
  ConditionallyApprovedMatchHandling,
} from '@/lib/derby/enums'
import { createExtendedClient } from '@/lib/supabase/extended'

async function loadMatchProfile(
  eventId: string,
  registrationId: string
): Promise<RegistrationMatchProfile | null> {
  const registration = await getRegistrationWithRelations(eventId, registrationId)
  if (!registration) return null

  const supabase = await createExtendedClient()

  let competitorLevel = 'unrated'
  if (registration.competitor_id) {
    const { data: competitor } = await supabase
      .from('competitors')
      .select('competitor_level')
      .eq('id', registration.competitor_id)
      .maybeSingle()

    competitorLevel = (competitor?.competitor_level as string) ?? 'unrated'
  }

  let gamefarmId: string | null = null
  if (registration.registry_rooster_id) {
    const { data: rooster } = await supabase
      .from('roosters')
      .select('gamefarm_id')
      .eq('id', registration.registry_rooster_id)
      .maybeSingle()

    gamefarmId = (rooster?.gamefarm_id as string) ?? null
  }

  return {
    registrationId: registration.id,
    entryId: registration.entry_id,
    registryRoosterId: registration.registry_rooster_id,
    competitorId: registration.competitor_id,
    gamefarmId,
    registrationStatus: registration.registration_status,
    approvalStatus: registration.approval_status,
    eligibilityStatus: registration.eligibility_status,
    inspectionStatus: registration.inspection_status,
    regPaymentStatus: registration.reg_payment_status,
    weightVerified: registration.weight_verified,
    competitionClass: registration.competition_class ?? 'unclassified',
    competitorLevel,
    entryDivision: registration.entry_division,
    officialWeightGrams: registration.official_weight_grams,
  }
}

function mapPairingStatusToCompatibility(status: string): CompatibilityStatus {
  if (status === 'prohibited') return 'prohibited'
  if (status === 'approval_required') return 'approval_required'
  return 'compatible'
}

function worstCompatibility(statuses: CompatibilityStatus[]): CompatibilityStatus {
  if (statuses.includes('prohibited')) return 'prohibited'
  if (statuses.includes('approval_required')) return 'approval_required'
  return 'compatible'
}

export async function evaluateMatchCompatibility(
  eventId: string,
  firstRegistrationId: string,
  secondRegistrationId: string
): Promise<MatchCompatibilityEvaluation> {
  const reasons: string[] = []
  const rules = []
  const compatibilityStatuses: CompatibilityStatus[] = []

  if (firstRegistrationId === secondRegistrationId) {
    return {
      status: 'prohibited',
      reasons: ['A rooster cannot be matched against itself'],
      rules: [],
      weightDifferenceGrams: null,
      evaluatedAt: new Date().toISOString(),
    }
  }

  const supabase = await createExtendedClient()
  const [{ data: event }, { data: policy }] = await Promise.all([
    supabase
      .from('events')
      .select(
        'classification_matching_enabled, match_weight_tolerance_grams, weight_verification_required, conditionally_approved_match_handling'
      )
      .eq('id', eventId)
      .maybeSingle(),
    supabase
      .from('derby_eligibility_policies')
      .select(
        'physical_inspection_required, entry_fee_payment_required'
      )
      .eq('event_id', eventId)
      .maybeSingle(),
  ])

  const [first, second] = await Promise.all([
    loadMatchProfile(eventId, firstRegistrationId),
    loadMatchProfile(eventId, secondRegistrationId),
  ])

  if (!first || !second) {
    return {
      status: 'prohibited',
      reasons: ['One or both registrations were not found'],
      rules: [],
      weightDifferenceGrams: null,
      evaluatedAt: new Date().toISOString(),
    }
  }

  if (first.entryId === second.entryId) {
    reasons.push('Roosters from the same entry cannot be matched')
    compatibilityStatuses.push('prohibited')
  }

  if (
    first.registryRoosterId &&
    second.registryRoosterId &&
    first.registryRoosterId === second.registryRoosterId
  ) {
    reasons.push('The same registry rooster cannot be matched against itself')
    compatibilityStatuses.push('prohibited')
  }

  if (first.gamefarmId && second.gamefarmId && first.gamefarmId === second.gamefarmId) {
    reasons.push('Roosters from the same gamefarm require review')
    compatibilityStatuses.push('approval_required')
  }

  const matchabilityChecks = [
    isRoosterRegistrationMatchable({
      registrationStatus: first.registrationStatus as never,
      approvalStatus: first.approvalStatus,
      eligibilityStatus: first.eligibilityStatus,
      weightVerified: first.weightVerified,
      weightVerificationRequired: Boolean(event?.weight_verification_required),
      inspectionStatus: first.inspectionStatus,
      physicalInspectionRequired: Boolean(policy?.physical_inspection_required),
      regPaymentStatus: first.regPaymentStatus,
      entryFeePaymentRequired: Boolean(policy?.entry_fee_payment_required),
      conditionallyApprovedMatchHandling:
        (event?.conditionally_approved_match_handling as ConditionallyApprovedMatchHandling) ??
        'exclude',
    }),
    isRoosterRegistrationMatchable({
      registrationStatus: second.registrationStatus as never,
      approvalStatus: second.approvalStatus,
      eligibilityStatus: second.eligibilityStatus,
      weightVerified: second.weightVerified,
      weightVerificationRequired: Boolean(event?.weight_verification_required),
      inspectionStatus: second.inspectionStatus,
      physicalInspectionRequired: Boolean(policy?.physical_inspection_required),
      regPaymentStatus: second.regPaymentStatus,
      entryFeePaymentRequired: Boolean(policy?.entry_fee_payment_required),
      conditionallyApprovedMatchHandling:
        (event?.conditionally_approved_match_handling as ConditionallyApprovedMatchHandling) ??
        'exclude',
    }),
  ]

  for (const [index, result] of matchabilityChecks.entries()) {
    if (!result.matchable) {
      reasons.push(...result.reasons.map((reason) => `Registration ${index + 1}: ${reason}`))
      compatibilityStatuses.push('prohibited')
    }
  }

  let weightDifferenceGrams: number | null = null
  if (first.officialWeightGrams != null && second.officialWeightGrams != null) {
    weightDifferenceGrams = Math.abs(
      first.officialWeightGrams - second.officialWeightGrams
    )

    const tolerance = event?.match_weight_tolerance_grams
    if (tolerance != null && weightDifferenceGrams > tolerance) {
      reasons.push(
        `Weight difference ${weightDifferenceGrams}g exceeds tolerance ${tolerance}g`
      )
      compatibilityStatuses.push('approval_required')
    }
  }

  if (event?.classification_matching_enabled) {
    const classificationChecks: Array<{
      type: ClassificationType
      firstValue: string
      secondValue: string
    }> = [
      {
        type: 'rooster_class',
        firstValue: first.competitionClass,
        secondValue: second.competitionClass,
      },
      {
        type: 'competitor_level',
        firstValue: first.competitorLevel,
        secondValue: second.competitorLevel,
      },
      {
        type: 'entry_division',
        firstValue: first.entryDivision,
        secondValue: second.entryDivision,
      },
    ]

    for (const check of classificationChecks) {
      const pairingStatus = await getPairingStatus({
        eventId,
        classificationType: check.type,
        firstValue: check.firstValue,
        secondValue: check.secondValue,
      })

      const mapped = mapPairingStatusToCompatibility(pairingStatus)
      compatibilityStatuses.push(mapped)

      rules.push({
        classificationType: check.type,
        firstValue: check.firstValue,
        secondValue: check.secondValue,
        pairingStatus,
        message:
          pairingStatus === 'allowed'
            ? `${check.type} pairing is allowed`
            : `${check.type} pairing is ${pairingStatus}`,
      })

      if (pairingStatus === 'prohibited') {
        reasons.push(`${check.type} pairing is prohibited`)
      } else if (pairingStatus === 'approval_required') {
        reasons.push(`${check.type} pairing requires approval`)
      }
    }
  }

  return {
    status: worstCompatibility(compatibilityStatuses),
    reasons,
    rules,
    weightDifferenceGrams,
    evaluatedAt: new Date().toISOString(),
  }
}

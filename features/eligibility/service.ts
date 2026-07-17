import 'server-only'

import { evaluateWeightEligibility } from '@/features/eligibility/schema'
import type {
  DerbyEligibilityEvaluation,
  EligibilityCheckResult,
  EligibilityEvaluationContext,
} from '@/features/eligibility/types'
import { getRegistrationWithRelations } from '@/features/registrations/queries'
import { resolveEffectiveExperienceStatus } from '@/features/roosters/experience'
import {
  ELIGIBILITY_FIELD_LABELS,
  type EligibilityFieldKey,
} from '@/lib/derby/eligibility-fields'
import type {
  EligibilityStatus,
  RejectionCategory,
  UnknownValueHandling,
} from '@/lib/derby/enums'
import { createExtendedClient } from '@/lib/supabase/extended'

function applyUnknownHandling(
  value: string | null | undefined,
  handling: UnknownValueHandling
): EligibilityCheckResult['outcome'] {
  const isUnknown = !value || value === 'unknown' || value === 'unclassified' || value === 'unassigned'
  if (!isUnknown) return 'pass'
  if (handling === 'allow') return 'pass'
  if (handling === 'prohibit') return 'fail'
  return 'approval_required'
}

function buildCheck(
  check: EligibilityCheckResult['check'],
  outcome: EligibilityCheckResult['outcome'],
  message: string,
  rejectionCategory?: RejectionCategory
): EligibilityCheckResult {
  return {
    check,
    outcome,
    passed: outcome === 'pass',
    message,
    rejectionCategory,
  }
}

const LEGACY_ELIGIBILITY_FIELD_LABELS: Record<string, string> = {
  experience: 'Experience',
  origin: 'Origin & breeding',
  association: 'Association membership',
  payment: 'Entry fee payment',
}

function buildSkippedCheck(
  field: string,
  check: EligibilityCheckResult['check']
): EligibilityCheckResult {
  const label =
    ELIGIBILITY_FIELD_LABELS[field as EligibilityFieldKey] ??
    LEGACY_ELIGIBILITY_FIELD_LABELS[field] ??
    field
  return buildCheck(check, 'pass', `${label} rules are not enabled for this event`)
}

function isPolicyFieldEnabled(
  enabledFields: string[] | null | undefined,
  field: string
): boolean {
  if (!enabledFields?.length) return false
  return enabledFields.includes(field)
}

function maybeRunCheck(
  context: EligibilityEvaluationContext,
  field: string,
  check: EligibilityCheckResult['check'],
  runner: () => EligibilityCheckResult
): EligibilityCheckResult {
  if (!isPolicyFieldEnabled(context.policy?.enabled_eligibility_fields, field)) {
    return buildSkippedCheck(field, check)
  }
  return runner()
}

function isBandingRulesActive(context: EligibilityEvaluationContext): boolean {
  const policy = context.policy
  if (!policy) return false

  return (
    policy.banding_required ||
    policy.band_verification_required ||
    policy.accepted_band_levels.length > 0 ||
    policy.accepted_band_organizations.length > 0 ||
    policy.accepted_band_years.length > 0 ||
    policy.accepted_band_seasons.length > 0
  )
}

function isOriginRulesActive(context: EligibilityEvaluationContext): boolean {
  const policy = context.policy
  if (!policy) return false

  return (
    policy.locally_bred_only ||
    !policy.imported_allowed ||
    policy.origin_verification_required ||
    policy.allowed_origin_types.length > 0 ||
    policy.allowed_breeding_relationships.length > 0
  )
}

function checkAge(context: EligibilityEvaluationContext): EligibilityCheckResult {
  const allowed =
    context.policy?.allowed_age_classes?.length
      ? context.policy.allowed_age_classes
      : context.eventAllowedAgeClasses

  const ageClass = context.ageClass ?? 'unknown'
  const unknownOutcome = applyUnknownHandling(
    ageClass,
    context.policy?.unknown_value_handling ?? context.eventUnknownValueHandling
  )

  if (unknownOutcome !== 'pass') {
    return buildCheck(
      'age',
      unknownOutcome,
      'Rooster age class is unknown',
      'age_ineligible'
    )
  }

  if (!allowed.includes(ageClass)) {
    return buildCheck(
      'age',
      'fail',
      `Age class ${ageClass} is not allowed for this event`,
      'age_ineligible'
    )
  }

  return buildCheck('age', 'pass', 'Age class is eligible')
}

function checkWeight(context: EligibilityEvaluationContext): EligibilityCheckResult {
  const minGrams =
    context.policy?.minimum_weight_grams ?? context.eventMinWeightGrams
  const maxGrams =
    context.policy?.maximum_weight_grams ?? context.eventMaxWeightGrams
  const weightVerificationRequired =
    context.policy?.weight_verification_required ??
    context.eventWeightVerificationRequired

  const weightGrams =
    context.officialWeightGrams ?? context.declaredWeightGrams

  if (weightVerificationRequired && !context.weightVerified) {
    return buildCheck('weight', 'pending', 'Official weight verification is required')
  }

  const outcome = evaluateWeightEligibility(weightGrams, minGrams, maxGrams)

  if (outcome === 'pending') {
    return buildCheck('weight', 'pending', 'Weight has not been recorded')
  }

  if (outcome === 'fail' && weightGrams != null && minGrams != null && weightGrams < minGrams) {
    return buildCheck(
      'weight',
      'fail',
      'Weight is below the event minimum',
      'weight_below_minimum'
    )
  }

  if (outcome === 'fail') {
    return buildCheck(
      'weight',
      'fail',
      'Weight is above the event maximum',
      'weight_above_maximum'
    )
  }

  if (context.weightVerificationStatus === 'failed') {
    return buildCheck(
      'weight',
      'fail',
      'Weight verification failed',
      'weight_above_maximum'
    )
  }

  return buildCheck('weight', 'pass', 'Weight is within limits')
}

function checkBanding(context: EligibilityEvaluationContext): EligibilityCheckResult {
  const policy = context.policy
  if (!policy || !isBandingRulesActive(context)) {
    return buildCheck('banding', 'pass', 'Banding rules are not configured')
  }

  if (context.bands.length === 0) {
    if (!policy.banding_required) {
      return buildCheck('banding', 'pass', 'Banding is optional for this event')
    }
    if (policy.allow_unbanded) {
      return buildCheck('banding', 'approval_required', 'Rooster is unbanded')
    }
    return buildCheck('banding', 'fail', 'A band is required', 'band_invalid')
  }

  const primaryBand = context.bands[0]

  if (
    policy.accepted_band_levels.length > 0 &&
    !policy.accepted_band_levels.includes(primaryBand.band_level)
  ) {
    return buildCheck('banding', 'fail', 'Band level is not accepted', 'band_invalid')
  }

  if (
    policy.accepted_band_organizations.length > 0 &&
    primaryBand.band_organization &&
    !policy.accepted_band_organizations.includes(primaryBand.band_organization)
  ) {
    return buildCheck('banding', 'fail', 'Band organization is not accepted', 'band_invalid')
  }

  if (
    policy.accepted_band_years.length > 0 &&
    primaryBand.band_year != null &&
    !policy.accepted_band_years.includes(primaryBand.band_year)
  ) {
    return buildCheck('banding', 'fail', 'Band year is not accepted', 'band_invalid')
  }

  if (
    policy.accepted_band_seasons.length > 0 &&
    primaryBand.band_season &&
    !policy.accepted_band_seasons.includes(primaryBand.band_season)
  ) {
    return buildCheck('banding', 'fail', 'Band season is not accepted', 'band_invalid')
  }

  if (
    policy.band_verification_required &&
    primaryBand.verification_status !== 'verified'
  ) {
    if (primaryBand.verification_status === 'rejected') {
      return buildCheck('banding', 'fail', 'Band verification was rejected', 'band_invalid')
    }
    return buildCheck('banding', 'pending', 'Band verification is pending', 'band_unverified')
  }

  return buildCheck('banding', 'pass', 'Band requirements satisfied')
}

function checkExperience(context: EligibilityEvaluationContext): EligibilityCheckResult {
  const allowed = context.policy?.allowed_experience_statuses ?? []
  if (allowed.length === 0) {
    return buildCheck('experience', 'pass', 'Experience rules are not configured')
  }

  const experience = context.experienceStatus ?? 'unknown'
  const unknownOutcome = applyUnknownHandling(
    experience,
    context.policy?.unknown_value_handling ?? context.eventUnknownValueHandling
  )

  if (unknownOutcome !== 'pass') {
    return buildCheck(
      'experience',
      unknownOutcome,
      'Experience record is unknown',
      'experience_ineligible'
    )
  }

  if (!allowed.includes(experience)) {
    return buildCheck(
      'experience',
      'fail',
      `Experience status ${experience} is not allowed`,
      'experience_ineligible'
    )
  }

  return buildCheck('experience', 'pass', 'Experience is eligible')
}

function checkOrigin(context: EligibilityEvaluationContext): EligibilityCheckResult {
  const policy = context.policy
  if (!policy || !isOriginRulesActive(context)) {
    return buildCheck('origin', 'pass', 'Origin rules are not configured')
  }

  const originType = context.originType ?? 'unknown'
  const breedingRelationship = context.breedingRelationship ?? 'unknown'

  if (policy?.locally_bred_only && originType !== 'locally_bred') {
    return buildCheck('origin', 'fail', 'Only locally bred roosters are allowed', 'origin_ineligible')
  }

  if (!policy?.imported_allowed && originType === 'imported') {
    return buildCheck('origin', 'fail', 'Imported roosters are not allowed', 'origin_ineligible')
  }

  if (
    policy?.allowed_origin_types?.length &&
    !policy.allowed_origin_types.includes(originType)
  ) {
    const unknownOutcome = applyUnknownHandling(
      originType,
      policy.unknown_value_handling
    )
    if (unknownOutcome !== 'pass') {
      return buildCheck(
        'origin',
        unknownOutcome,
        'Origin type is unknown',
        'origin_ineligible'
      )
    }
    return buildCheck('origin', 'fail', 'Origin type is not allowed', 'origin_ineligible')
  }

  if (
    policy?.allowed_breeding_relationships?.length &&
    !policy.allowed_breeding_relationships.includes(breedingRelationship)
  ) {
    return buildCheck(
      'origin',
      'fail',
      'Breeding relationship is not allowed',
      'origin_ineligible'
    )
  }

  if (policy?.origin_verification_required && !context.originVerified) {
    return buildCheck('origin', 'pending', 'Origin verification is required', 'origin_ineligible')
  }

  return buildCheck('origin', 'pass', 'Origin requirements satisfied')
}

function checkAssociation(context: EligibilityEvaluationContext): EligibilityCheckResult {
  const policy = context.policy
  if (!policy?.association_members_only) {
    return buildCheck('association', 'pass', 'Association membership is not required')
  }

  if (!context.competitorId) {
    return buildCheck(
      'association',
      'fail',
      'Competitor record is required for association checks',
      'association_requirement_failed'
    )
  }

  const approvedIds = policy.approved_association_ids ?? []
  const hasApprovedMembership = context.competitorAssociationIds.some((id) =>
    approvedIds.length === 0 ? true : approvedIds.includes(id)
  )

  if (!hasApprovedMembership) {
    return buildCheck(
      'association',
      'fail',
      'Competitor is not a member of an approved association',
      'association_requirement_failed'
    )
  }

  return buildCheck('association', 'pass', 'Association requirements satisfied')
}

function checkInspection(context: EligibilityEvaluationContext): EligibilityCheckResult {
  if (!context.eventPhysicalInspectionRequired) {
    return buildCheck('inspection', 'pass', 'Physical inspection is not required')
  }

  if (context.inspectionStatus === 'passed') {
    return buildCheck('inspection', 'pass', 'Physical inspection passed')
  }

  if (context.inspectionStatus === 'failed') {
    return buildCheck('inspection', 'fail', 'Physical inspection failed', 'inspection_failed')
  }

  if (context.inspectionStatus === 'for_review') {
    return buildCheck('inspection', 'approval_required', 'Physical inspection needs review')
  }

  return buildCheck('inspection', 'pending', 'Physical inspection is pending', 'inspection_failed')
}

function checkPayment(context: EligibilityEvaluationContext): EligibilityCheckResult {
  if (!context.policy?.entry_fee_payment_required) {
    return buildCheck('payment', 'pass', 'Entry fee payment is not required')
  }

  if (context.regPaymentStatus === 'paid') {
    return buildCheck('payment', 'pass', 'Registration fee is paid')
  }

  if (context.regPaymentStatus === 'partial') {
    return buildCheck('payment', 'approval_required', 'Registration fee is only partially paid')
  }

  return buildCheck('payment', 'fail', 'Registration fee is unpaid', 'payment_incomplete')
}

function aggregateEligibilityStatus(
  checks: EligibilityCheckResult[],
  enforcementEnabled: boolean
): EligibilityStatus {
  if (!enforcementEnabled) return 'eligible'

  if (checks.some((check) => check.outcome === 'fail')) {
    return 'ineligible'
  }

  if (checks.some((check) => check.outcome === 'pending')) {
    return 'pending_review'
  }

  if (checks.some((check) => check.outcome === 'approval_required')) {
    return 'conditionally_eligible'
  }

  return 'eligible'
}

export function evaluateEligibilityFromContext(
  context: EligibilityEvaluationContext
): DerbyEligibilityEvaluation {
  const checks: EligibilityCheckResult[] = [
    maybeRunCheck(context, 'age_class', 'age', () => checkAge(context)),
    maybeRunCheck(context, 'weight', 'weight', () => checkWeight(context)),
    maybeRunCheck(context, 'banding', 'banding', () => checkBanding(context)),
    maybeRunCheck(context, 'experience', 'experience', () => checkExperience(context)),
    maybeRunCheck(context, 'origin', 'origin', () => checkOrigin(context)),
    maybeRunCheck(context, 'association', 'association', () => checkAssociation(context)),
    context.eventPhysicalInspectionRequired
      ? checkInspection(context)
      : buildCheck('inspection', 'pass', 'Physical inspection is not required'),
    maybeRunCheck(context, 'payment', 'payment', () => checkPayment(context)),
  ]

  const rejectionCategories = [
    ...new Set(
      checks
        .filter((check) => check.rejectionCategory && !check.passed)
        .map((check) => check.rejectionCategory as RejectionCategory)
    ),
  ]

  const status = aggregateEligibilityStatus(
    checks,
    context.eligibilityEnforcementEnabled
  )

  return {
    status,
    checks,
    rejectionCategories,
    canMatch: status === 'eligible' || status === 'conditionally_eligible',
    evaluatedAt: new Date().toISOString(),
  }
}

export async function evaluateDerbyEligibility(
  eventId: string,
  registrationId: string
): Promise<DerbyEligibilityEvaluation> {
  const registration = await getRegistrationWithRelations(eventId, registrationId)
  if (!registration) {
    return {
      status: 'ineligible',
      checks: [
        buildCheck('age', 'fail', 'Registration not found', 'other'),
      ],
      rejectionCategories: ['other'],
      canMatch: false,
      evaluatedAt: new Date().toISOString(),
    }
  }

  const supabase = await createExtendedClient()

  const [{ data: event }, { data: policy }] = await Promise.all([
    supabase
      .from('events')
      .select(
        'allowed_age_classes, min_weight_grams, max_weight_grams, weight_verification_required, unknown_value_handling, eligibility_enforcement_enabled, physical_inspection_required'
      )
      .eq('id', eventId)
      .maybeSingle(),
    supabase
      .from('derby_eligibility_policies')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle(),
  ])

  let bands: EligibilityEvaluationContext['bands'] = []
  if (registration.registry_rooster_id) {
    const { data: bandRows } = await supabase
      .from('rooster_bands')
      .select(
        'band_level, band_organization, band_number, band_year, band_season, verification_status'
      )
      .eq('rooster_id', registration.registry_rooster_id)
      .order('created_at', { ascending: true })

    bands = (bandRows ?? []) as EligibilityEvaluationContext['bands']
  }

  let competitorAssociationIds: string[] = []
  if (registration.competitor_id) {
    const { data: associations } = await supabase
      .from('competitor_associations')
      .select('association_id')
      .eq('competitor_id', registration.competitor_id)

    competitorAssociationIds = ((associations ?? []) as Array<{ association_id: string }>).map(
      (row) => row.association_id
    )
  }

  const { data: registryRooster } = registration.registry_rooster_id
    ? await supabase
        .from('roosters')
        .select(
          'declared_external_experience_status, calculated_experience_status, external_experience_verified_at, origin_verified'
        )
        .eq('id', registration.registry_rooster_id)
        .maybeSingle()
    : { data: null }

  const experienceStatus = resolveEffectiveExperienceStatus({
    calculated: (registration.calculated_experience_status ??
      registryRooster?.calculated_experience_status ??
      'unknown') as never,
    declaredExternal: registryRooster?.declared_external_experience_status as never,
    externalVerified: Boolean(registryRooster?.external_experience_verified_at),
  })

  const context: EligibilityEvaluationContext = {
    registrationId,
    eventId,
    ageClass: registration.age_class,
    officialWeightGrams: registration.official_weight_grams,
    declaredWeightGrams: registration.declared_weight_grams,
    weightVerified: registration.weight_verified,
    weightVerificationStatus: registration.weight_verification_status,
    inspectionStatus: registration.inspection_status,
    regPaymentStatus: registration.reg_payment_status,
    experienceStatus,
    originType: registration.origin_type,
    breedingRelationship: registration.breeding_relationship,
    originVerified: Boolean(registryRooster?.origin_verified),
    competitionClass: registration.competition_class,
    competitorId: registration.competitor_id,
    bands,
    competitorAssociationIds,
    eventAllowedAgeClasses: (event?.allowed_age_classes as string[]) ?? [
      'stag',
      'bullstag',
      'cock',
    ],
    eventMinWeightGrams: event?.min_weight_grams ?? null,
    eventMaxWeightGrams: event?.max_weight_grams ?? null,
    eventWeightVerificationRequired: Boolean(event?.weight_verification_required),
    eventUnknownValueHandling:
      (event?.unknown_value_handling as UnknownValueHandling) ?? 'approval_required',
    eventPhysicalInspectionRequired: Boolean(event?.physical_inspection_required),
    policy: (policy as EligibilityEvaluationContext['policy']) ?? null,
    eligibilityEnforcementEnabled: Boolean(event?.eligibility_enforcement_enabled),
  }

  return evaluateEligibilityFromContext(context)
}

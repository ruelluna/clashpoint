import 'server-only'

import { evaluateDerbyEligibility } from '@/features/eligibility/service'
import type { DerbyEligibilityEvaluation } from '@/features/eligibility/types'
import { getDerbyEligibilityPolicy } from '@/features/eligibility/queries'
import {
  resolvePostEligibilityTargetStatus,
  type RegistrationWorkflowRequirements,
} from '@/features/registrations/workflow'
import type {
  RoosterPolicyValidationContext,
} from '@/features/entries/policy-validation'
import { formatEligibilityErrors } from '@/features/eligibility/format-errors'
import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'
import {
  AGE_CLASS_PRESETS,
  BAND_LEVEL_PRESETS,
  BREEDING_RELATIONSHIP_PRESETS,
  EXPERIENCE_STATUS_PRESETS,
  ORIGIN_TYPE_PRESETS,
  type EligibilityFieldKey,
  type EligibilityOptionPreset,
  isEligibilityFieldEnabled,
  parseEligibilityFieldKeys,
} from '@/lib/derby/eligibility-fields'
import type { UnknownValueHandling } from '@/lib/derby/enums'
import { gramsToKg } from '@/lib/derby/enums'
import { createExtendedClient } from '@/lib/supabase/extended'

export type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'

export type EventWorkflowConfig = {
  weight_verification_required: boolean
  require_rooster_entry_approval: boolean
  allow_conditional_approval: boolean
  eligibility_enforcement_enabled: boolean
  physical_inspection_required: boolean
  document_verification_required: boolean
  band_verification_required: boolean
}

export type ApplyRegistrationEligibilityResult = {
  evaluation: DerbyEligibilityEvaluation
  error?: string
  blocked?: boolean
  eligibilityStatus?: string
  registrationStatus?: string
}

function filterPresets(
  presets: EligibilityOptionPreset[],
  allowed: string[]
): EligibilityOptionPreset[] {
  if (allowed.length === 0) return presets
  const allowedSet = new Set(allowed)
  return presets.filter((preset) => allowedSet.has(preset.value))
}

export async function getEntryFormEligibilityContext(
  eventId: string
): Promise<EntryFormEligibilityContext | null> {
  const supabase = await createExtendedClient()
  const { data: event } = await supabase
    .from('events')
    .select(
      'event_type, eligibility_enforcement_enabled, allowed_age_classes, min_weight_grams, max_weight_grams, weight_verification_required, unknown_value_handling'
    )
    .eq('id', eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!event || event.event_type !== 'derby') return null

  const policy = await getDerbyEligibilityPolicy(eventId)
  const enabledFields = parseEligibilityFieldKeys(policy?.enabled_eligibility_fields ?? [])
  const allowedAgeClasses = filterPresets(
    AGE_CLASS_PRESETS,
    policy?.allowed_age_classes?.length
      ? policy.allowed_age_classes
      : ((event.allowed_age_classes as string[]) ?? [])
  )

  const minGrams =
    isEligibilityFieldEnabled(enabledFields, 'weight') && policy?.minimum_weight_grams != null
      ? policy.minimum_weight_grams
      : (event.min_weight_grams as number | null) ?? null
  const maxGrams =
    isEligibilityFieldEnabled(enabledFields, 'weight') && policy?.maximum_weight_grams != null
      ? policy.maximum_weight_grams
      : (event.max_weight_grams as number | null) ?? null

  return {
    eligibilityEnforcementEnabled: Boolean(event.eligibility_enforcement_enabled),
    enabledFields,
    unknownValueHandling:
      (policy?.unknown_value_handling as UnknownValueHandling) ??
      (event.unknown_value_handling as UnknownValueHandling) ??
      'approval_required',
    allowedAgeClasses,
    minimumWeightGrams: minGrams,
    maximumWeightGrams: maxGrams,
    weightVerificationRequired: Boolean(
      policy?.weight_verification_required ?? event.weight_verification_required
    ),
    bandingRequired: Boolean(policy?.banding_required),
    allowUnbanded: policy?.allow_unbanded ?? true,
    acceptedBandLevels: filterPresets(
      BAND_LEVEL_PRESETS,
      (policy?.accepted_band_levels as string[]) ?? []
    ),
    acceptedBandOrganizations: (policy?.accepted_band_organizations as string[]) ?? [],
    acceptedBandYears: (policy?.accepted_band_years as number[]) ?? [],
    acceptedBandSeasons: (policy?.accepted_band_seasons as string[]) ?? [],
    allowedExperienceStatuses: filterPresets(
      EXPERIENCE_STATUS_PRESETS,
      (policy?.allowed_experience_statuses as string[]) ?? []
    ),
    allowedOriginTypes: filterPresets(
      ORIGIN_TYPE_PRESETS,
      (policy?.allowed_origin_types as string[]) ?? []
    ),
    allowedBreedingRelationships: filterPresets(
      BREEDING_RELATIONSHIP_PRESETS,
      (policy?.allowed_breeding_relationships as string[]) ?? []
    ),
    associationMembersOnly: Boolean(policy?.association_members_only),
    physicalInspectionRequired: Boolean(policy?.physical_inspection_required),
    documentVerificationRequired: Boolean(policy?.document_verification_required),
    entryFeePaymentRequired: Boolean(policy?.entry_fee_payment_required),
  }
}

export function formatWeightRangeFromGrams(
  minGrams: number | null,
  maxGrams: number | null
): string {
  if (minGrams == null && maxGrams == null) return 'No weight limits configured'
  return `${gramsToKg(minGrams)} – ${gramsToKg(maxGrams)} kg`
}

export { formatEligibilityErrors } from '@/features/eligibility/format-errors'

export async function getEventWorkflowConfig(
  eventId: string
): Promise<{ error?: string; config?: EventWorkflowConfig }> {
  const supabase = await createExtendedClient()
  const { data, error } = await supabase
    .from('events')
    .select(
      'id, weight_verification_required, require_rooster_entry_approval, allow_conditional_approval, eligibility_enforcement_enabled'
    )
    .eq('id', eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'Event not found' }

  const { data: policy } = await supabase
    .from('derby_eligibility_policies')
    .select(
      'physical_inspection_required, document_verification_required, band_verification_required'
    )
    .eq('event_id', eventId)
    .maybeSingle()

  return {
    config: {
      weight_verification_required: Boolean(data.weight_verification_required),
      require_rooster_entry_approval: Boolean(data.require_rooster_entry_approval),
      allow_conditional_approval: Boolean(data.allow_conditional_approval),
      eligibility_enforcement_enabled: Boolean(data.eligibility_enforcement_enabled),
      physical_inspection_required: Boolean(policy?.physical_inspection_required),
      document_verification_required: Boolean(policy?.document_verification_required),
      band_verification_required: Boolean(policy?.band_verification_required),
    },
  }
}

function deriveRegistrationFields(
  evaluation: DerbyEligibilityEvaluation,
  workflowConfig: EventWorkflowConfig,
  currentRegistrationStatus: string
): {
  registrationStatus: string
  approvalStatus: string
  lineupStatus: string
} {
  const requirements: RegistrationWorkflowRequirements = {
    weightVerificationRequired: workflowConfig.weight_verification_required,
    physicalInspectionRequired: workflowConfig.physical_inspection_required,
    documentVerificationRequired: workflowConfig.document_verification_required,
    bandVerificationRequired: workflowConfig.band_verification_required,
    requireRoosterEntryApproval: workflowConfig.require_rooster_entry_approval,
  }

  const hasBlockingFailures = evaluation.status === 'ineligible'
  const hasPendingChecks =
    evaluation.status === 'pending_review' ||
    evaluation.checks.some(
      (check) => check.outcome === 'pending' || check.outcome === 'approval_required'
    )

  const registrationStatus = resolvePostEligibilityTargetStatus({
    current: currentRegistrationStatus as never,
    requirements,
    hasBlockingFailures,
    hasPendingChecks,
    allowConditionalApproval: workflowConfig.allow_conditional_approval,
  })

  if (registrationStatus === 'approved') {
    return {
      registrationStatus: 'approved',
      approvalStatus: 'approved',
      lineupStatus: 'verified',
    }
  }

  if (registrationStatus === 'conditionally_approved') {
    return {
      registrationStatus: 'conditionally_approved',
      approvalStatus: 'conditionally_approved',
      lineupStatus: 'verified',
    }
  }

  if (registrationStatus === 'rejected') {
    return {
      registrationStatus: 'pending_review',
      approvalStatus: 'pending',
      lineupStatus: 'submitted',
    }
  }

  return {
    registrationStatus,
    approvalStatus: 'pending',
    lineupStatus: 'submitted',
  }
}

export async function applyRegistrationEligibility(
  actorId: string,
  eventId: string,
  registrationId: string,
  options?: { blockOnIneligible?: boolean; currentRegistrationStatus?: string }
): Promise<ApplyRegistrationEligibilityResult> {
  const blockOnIneligible = options?.blockOnIneligible ?? true
  const evaluation = await evaluateDerbyEligibility(eventId, registrationId)

  const workflowResult = await getEventWorkflowConfig(eventId)
  if (workflowResult.error || !workflowResult.config) {
    return { evaluation, error: workflowResult.error ?? 'Event configuration unavailable' }
  }

  const workflowConfig = workflowResult.config
  const blocked =
    blockOnIneligible &&
    workflowConfig.eligibility_enforcement_enabled &&
    evaluation.status === 'ineligible'

  if (blocked) {
    return {
      evaluation,
      blocked: true,
      error: formatEligibilityErrors(evaluation),
    }
  }

  const currentStatus = options?.currentRegistrationStatus ?? 'submitted'
  const derived = deriveRegistrationFields(evaluation, workflowConfig, currentStatus)
  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('rooster_event_registrations')
    .update({
      eligibility_status: evaluation.status,
      eligibility_snapshot: evaluation,
      eligibility_checked_at: now,
      eligibility_checked_by: actorId,
      registration_status: derived.registrationStatus,
      approval_status: derived.approvalStatus,
      status: derived.lineupStatus,
      updated_at: now,
      ...(derived.registrationStatus === 'approved' ||
      derived.registrationStatus === 'conditionally_approved'
        ? { approved_by: actorId, approved_at: now }
        : {}),
    })
    .eq('id', registrationId)
    .eq('event_id', eventId)

  if (error) {
    return { evaluation, error: error.message }
  }

  return {
    evaluation,
    eligibilityStatus: evaluation.status,
    registrationStatus: derived.registrationStatus,
  }
}

export async function persistEligibilitySnapshot(
  actorId: string,
  eventId: string,
  registrationId: string
): Promise<{ error?: string; eligibilityStatus?: string }> {
  const result = await applyRegistrationEligibility(actorId, eventId, registrationId, {
    blockOnIneligible: false,
  })
  if (result.error) return { error: result.error }
  return { eligibilityStatus: result.eligibilityStatus }
}

export function toPolicyValidationContext(
  context: EntryFormEligibilityContext
): RoosterPolicyValidationContext {
  return {
    enabledFields: context.enabledFields,
    unknownValueHandling: context.unknownValueHandling,
    allowedAgeClasses: context.allowedAgeClasses.map((item) => item.value),
    minimumWeightGrams: context.minimumWeightGrams,
    maximumWeightGrams: context.maximumWeightGrams,
    bandingRequired: context.bandingRequired,
    acceptedBandLevels: context.acceptedBandLevels.map((item) => item.value),
    acceptedBandOrganizations: context.acceptedBandOrganizations,
    acceptedBandYears: context.acceptedBandYears,
    acceptedBandSeasons: context.acceptedBandSeasons,
  }
}

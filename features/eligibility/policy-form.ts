import { upsertEligibilityPolicySchema, type UpsertEligibilityPolicyInput } from '@/features/eligibility/schema'
import { parseEligibilityFieldKeys } from '@/lib/derby/eligibility-fields'

function readStringArray(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((value) => value.toString().trim())
    .filter(Boolean)
}

function readIntArray(formData: FormData, name: string): number[] {
  return readStringArray(formData, name)
    .map((value) => Number.parseInt(value, 10))
    .filter((value) => Number.isFinite(value))
}

export function hasEligibilityPolicyFormData(formData: FormData): boolean {
  const enabledFields = parseEligibilityFieldKeys(
    readStringArray(formData, 'enabledFields')
  )
  if (enabledFields.length > 0) return true
  return formData.get('eligibilityEnforcementEnabled') === 'on'
}

export function parseEligibilityPolicyFormData(
  formData: FormData,
  eventId?: string
): { data?: UpsertEligibilityPolicyInput; error?: string } {
  const resolvedEventId = eventId ?? formData.get('eventId')?.toString()
  const enabledFields = parseEligibilityFieldKeys(
    readStringArray(formData, 'enabledFields')
  )

  const parsed = upsertEligibilityPolicySchema.safeParse({
    eventId: resolvedEventId,
    policyStatus: formData.get('policyStatus')?.toString() ?? 'active',
    enabledFields,
    eligibilityEnforcementEnabled: formData.get('eligibilityEnforcementEnabled') === 'on',
    allowedAgeClasses: readStringArray(formData, 'allowedAgeClasses'),
    minimumWeightGrams: formData.get('minimumWeightGrams')?.toString().trim() || undefined,
    maximumWeightGrams: formData.get('maximumWeightGrams')?.toString().trim() || undefined,
    weightVerificationRequired: formData.get('weightVerificationRequired') === 'on',
    bandingRequired: formData.get('bandingRequired') === 'on',
    allowUnbanded: formData.get('allowUnbanded') === 'on',
    bandVerificationRequired: formData.get('bandVerificationRequired') === 'on',
    acceptedBandLevels: readStringArray(formData, 'acceptedBandLevels'),
    acceptedBandOrganizations: readStringArray(formData, 'acceptedBandOrganizations'),
    acceptedBandYears: readIntArray(formData, 'acceptedBandYears'),
    acceptedBandSeasons: readStringArray(formData, 'acceptedBandSeasons'),
    allowedExperienceStatuses: readStringArray(formData, 'allowedExperienceStatuses'),
    allowedOriginTypes: readStringArray(formData, 'allowedOriginTypes'),
    allowedBreedingRelationships: readStringArray(formData, 'allowedBreedingRelationships'),
    associationMembersOnly: formData.get('associationMembersOnly') === 'on',
    approvedAssociationIds: readStringArray(formData, 'approvedAssociationIds'),
    locallyBredOnly: formData.get('locallyBredOnly') === 'on',
    importedAllowed: formData.get('importedAllowed') !== 'off',
    originVerificationRequired: formData.get('originVerificationRequired') === 'on',
    physicalInspectionRequired: formData.get('physicalInspectionRequired') === 'on',
    entryFeePaymentRequired: formData.get('entryFeePaymentRequired') === 'on',
    unknownValueHandling: formData.get('unknownValueHandling') ?? 'approval_required',
    eligibilityNotes: formData.get('eligibilityNotes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid eligibility policy input' }
  }

  return { data: parsed.data }
}

export function buildEligibilityPolicyPayload(
  input: UpsertEligibilityPolicyInput,
  actorId: string
) {
  const enabledFields = input.enabledFields
  const bandingEnabled = enabledFields.includes('banding')
  const weightEnabled = enabledFields.includes('weight')
  const ageEnabled = enabledFields.includes('age_class')

  return {
    event_id: input.eventId,
    policy_status: input.policyStatus,
    enabled_eligibility_fields: input.enabledFields,
    allowed_age_classes: ageEnabled ? input.allowedAgeClasses : [],
    minimum_weight_grams: weightEnabled ? (input.minimumWeightGrams ?? null) : null,
    maximum_weight_grams: weightEnabled ? (input.maximumWeightGrams ?? null) : null,
    weight_verification_required: weightEnabled ? input.weightVerificationRequired : false,
    banding_required: bandingEnabled ? input.bandingRequired : false,
    allow_unbanded: bandingEnabled ? input.allowUnbanded : true,
    band_verification_required: bandingEnabled ? input.bandVerificationRequired : false,
    accepted_band_levels: bandingEnabled ? input.acceptedBandLevels : [],
    accepted_band_organizations: bandingEnabled ? input.acceptedBandOrganizations : [],
    accepted_band_years: bandingEnabled ? input.acceptedBandYears : [],
    accepted_band_seasons: bandingEnabled ? input.acceptedBandSeasons : [],
    allowed_experience_statuses: [],
    allowed_origin_types: [],
    allowed_breeding_relationships: [],
    association_members_only: false,
    approved_association_ids: [],
    locally_bred_only: false,
    imported_allowed: true,
    origin_verification_required: false,
    physical_inspection_required: false,
    document_verification_required: false,
    entry_fee_payment_required: false,
    unknown_value_handling: input.unknownValueHandling,
    eligibility_notes: input.eligibilityNotes ?? null,
    updated_by: actorId,
    updated_at: new Date().toISOString(),
    eligibility_enforcement_enabled: input.eligibilityEnforcementEnabled,
  }
}

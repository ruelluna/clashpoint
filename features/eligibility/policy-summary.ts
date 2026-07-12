import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'
import type { DerbyEligibilityPolicyRow } from '@/features/eligibility/queries'
import {
  ELIGIBILITY_FIELD_DESCRIPTIONS,
  ELIGIBILITY_FIELD_LABELS,
  type EligibilityFieldKey,
  isEligibilityFieldEnabled,
} from '@/lib/derby/eligibility-fields'
import { gramsToKg } from '@/lib/derby/enums'

function formatWeightRangeFromGrams(minGrams: number | null, maxGrams: number | null): string {
  if (minGrams == null && maxGrams == null) return 'No weight limits configured'
  return `${gramsToKg(minGrams)} – ${gramsToKg(maxGrams)} kg`
}

export type EligibilityPolicySummaryItem = {
  field: EligibilityFieldKey
  label: string
  description: string
  configuredOptions: string[]
  entryFieldsToFill: string[]
}

export type EligibilityPolicySummary = {
  enforcementEnabled: boolean
  unknownValueHandling: string
  policyStatus: string | null
  items: EligibilityPolicySummaryItem[]
  workflowNotes: string[]
}

const UNKNOWN_VALUE_LABELS: Record<string, string> = {
  approval_required: 'Unknown values require staff approval',
  prohibit: 'Unknown values are not allowed — matching fields are required on entry',
}

function formatList(values: string[], fallback: string): string {
  return values.length > 0 ? values.join(', ') : fallback
}

function buildAgeClassItem(context: EntryFormEligibilityContext): EligibilityPolicySummaryItem {
  const labels = context.allowedAgeClasses.map((item) => item.label)
  const required = context.unknownValueHandling === 'prohibit'

  return {
    field: 'age_class',
    label: ELIGIBILITY_FIELD_LABELS.age_class,
    description: ELIGIBILITY_FIELD_DESCRIPTIONS.age_class,
    configuredOptions: [
      `Allowed: ${formatList(labels, 'All configured age classes')}`,
    ],
    entryFieldsToFill: required ? ['Age class (required)'] : ['Age class'],
  }
}

function buildWeightItem(context: EntryFormEligibilityContext): EligibilityPolicySummaryItem {
  const options = [
    `Range: ${formatWeightRangeFromGrams(
      context.minimumWeightGrams,
      context.maximumWeightGrams
    )}`,
  ]

  if (context.weightVerificationRequired) {
    options.push('Official weight verification required before matching')
  }

  return {
    field: 'weight',
    label: ELIGIBILITY_FIELD_LABELS.weight,
    description: ELIGIBILITY_FIELD_DESCRIPTIONS.weight,
    configuredOptions: options,
    entryFieldsToFill: ['Weight (kg)'],
  }
}

function buildBandingItem(
  context: EntryFormEligibilityContext,
  policy: DerbyEligibilityPolicyRow | null
): EligibilityPolicySummaryItem {
  const options: string[] = []

  if (context.bandingRequired) {
    options.push('Banding is required')
  }
  if (context.allowUnbanded) {
    options.push('Unbanded roosters allowed')
  }
  if (context.acceptedBandLevels.length > 0) {
    options.push(
      `Band levels: ${context.acceptedBandLevels.map((item) => item.label).join(', ')}`
    )
  }
  if (context.acceptedBandOrganizations.length > 0) {
    options.push(`Organizations: ${context.acceptedBandOrganizations.join(', ')}`)
  }
  if (context.acceptedBandYears.length > 0) {
    options.push(`Years: ${context.acceptedBandYears.join(', ')}`)
  }
  if (context.acceptedBandSeasons.length > 0) {
    options.push(`Seasons: ${context.acceptedBandSeasons.join(', ')}`)
  }
  if (policy?.band_verification_required) {
    options.push('Band verification required before approval')
  }

  const entryFields = ['Band number', 'Weight (kg)']
  if (context.bandingRequired) entryFields.push('Band level (required)')
  else entryFields.push('Band level')
  entryFields.push('Band organization', 'Band year', 'Band season')

  return {
    field: 'banding',
    label: ELIGIBILITY_FIELD_LABELS.banding,
    description: ELIGIBILITY_FIELD_DESCRIPTIONS.banding,
    configuredOptions: options.length > 0 ? options : ['Banding rules configured'],
    entryFieldsToFill: entryFields,
  }
}

function buildExperienceItem(context: EntryFormEligibilityContext): EligibilityPolicySummaryItem {
  const labels = context.allowedExperienceStatuses.map((item) => item.label)

  return {
    field: 'experience',
    label: ELIGIBILITY_FIELD_LABELS.experience,
    description: ELIGIBILITY_FIELD_DESCRIPTIONS.experience,
    configuredOptions: [
      `Allowed: ${formatList(labels, 'All experience statuses')}`,
    ],
    entryFieldsToFill: ['Experience'],
  }
}

function buildOriginItem(
  context: EntryFormEligibilityContext,
  policy: DerbyEligibilityPolicyRow | null
): EligibilityPolicySummaryItem {
  const options: string[] = []
  const originLabels = context.allowedOriginTypes.map((item) => item.label)
  const breedingLabels = context.allowedBreedingRelationships.map((item) => item.label)

  if (originLabels.length > 0) {
    options.push(`Origin types: ${originLabels.join(', ')}`)
  }
  if (breedingLabels.length > 0) {
    options.push(`Breeding: ${breedingLabels.join(', ')}`)
  }
  if (policy?.locally_bred_only) {
    options.push('Locally bred only')
  }
  if (policy && !policy.imported_allowed) {
    options.push('Imported roosters not allowed')
  }
  if (policy?.origin_verification_required) {
    options.push('Origin verification required before approval')
  }

  return {
    field: 'origin',
    label: ELIGIBILITY_FIELD_LABELS.origin,
    description: ELIGIBILITY_FIELD_DESCRIPTIONS.origin,
    configuredOptions: options.length > 0 ? options : ['Origin rules configured'],
    entryFieldsToFill: ['Origin type', 'Breeding relationship'],
  }
}

function buildAssociationItem(associationNames: string[]): EligibilityPolicySummaryItem {
  return {
    field: 'association',
    label: ELIGIBILITY_FIELD_LABELS.association,
    description: ELIGIBILITY_FIELD_DESCRIPTIONS.association,
    configuredOptions: [
      associationNames.length > 0
        ? `Approved associations: ${associationNames.join(', ')}`
        : 'Association membership required',
    ],
    entryFieldsToFill: [
      'Owner linked to a saved competitor with approved association membership',
    ],
  }
}

function buildInspectionItem(): EligibilityPolicySummaryItem {
  return {
    field: 'inspection',
    label: ELIGIBILITY_FIELD_LABELS.inspection,
    description: ELIGIBILITY_FIELD_DESCRIPTIONS.inspection,
    configuredOptions: ['Physical inspection required before approval'],
    entryFieldsToFill: ['Completed during registration review (not on entry form)'],
  }
}

function buildDocumentsItem(): EligibilityPolicySummaryItem {
  return {
    field: 'documents',
    label: ELIGIBILITY_FIELD_LABELS.documents,
    description: ELIGIBILITY_FIELD_DESCRIPTIONS.documents,
    configuredOptions: ['Supporting documents must be verified before approval'],
    entryFieldsToFill: ['Submitted during registration review (not on entry form)'],
  }
}

function buildPaymentItem(): EligibilityPolicySummaryItem {
  return {
    field: 'payment',
    label: ELIGIBILITY_FIELD_LABELS.payment,
    description: ELIGIBILITY_FIELD_DESCRIPTIONS.payment,
    configuredOptions: ['Entry fee payment required before approval'],
    entryFieldsToFill: ['Recorded in payments ledger (not on entry form)'],
  }
}

const FIELD_BUILDERS: Record<
  EligibilityFieldKey,
  (
    context: EntryFormEligibilityContext,
    policy: DerbyEligibilityPolicyRow | null,
    associationNames: string[]
  ) => EligibilityPolicySummaryItem
> = {
  age_class: (context) => buildAgeClassItem(context),
  weight: (context) => buildWeightItem(context),
  banding: (context, policy) => buildBandingItem(context, policy),
  experience: (context) => buildExperienceItem(context),
  origin: (context, policy) => buildOriginItem(context, policy),
  association: (_context, _policy, associationNames) => buildAssociationItem(associationNames),
  inspection: () => buildInspectionItem(),
  documents: () => buildDocumentsItem(),
  payment: () => buildPaymentItem(),
}

export function buildEligibilityPolicySummary(
  context: EntryFormEligibilityContext,
  policy: DerbyEligibilityPolicyRow | null,
  associationNames: string[] = []
): EligibilityPolicySummary {
  const items = context.enabledFields.map((field) =>
    FIELD_BUILDERS[field](context, policy, associationNames)
  )

  const workflowNotes: string[] = []

  if (context.physicalInspectionRequired && !isEligibilityFieldEnabled(context.enabledFields, 'inspection')) {
    workflowNotes.push('Physical inspection required')
  }
  if (context.documentVerificationRequired && !isEligibilityFieldEnabled(context.enabledFields, 'documents')) {
    workflowNotes.push('Document verification required')
  }
  if (context.entryFeePaymentRequired && !isEligibilityFieldEnabled(context.enabledFields, 'payment')) {
    workflowNotes.push('Entry fee payment required')
  }

  return {
    enforcementEnabled: context.eligibilityEnforcementEnabled,
    unknownValueHandling:
      UNKNOWN_VALUE_LABELS[context.unknownValueHandling] ??
      context.unknownValueHandling,
    policyStatus: policy?.policy_status ?? null,
    items,
    workflowNotes,
  }
}

export function hasEligibilityOptionsConfigured(
  context: EntryFormEligibilityContext | null
): context is EntryFormEligibilityContext {
  return context != null && context.enabledFields.length > 0
}

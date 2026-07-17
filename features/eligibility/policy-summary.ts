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

function buildDocumentsItem(): EligibilityPolicySummaryItem {
  return {
    field: 'documents',
    label: ELIGIBILITY_FIELD_LABELS.documents,
    description: ELIGIBILITY_FIELD_DESCRIPTIONS.documents,
    configuredOptions: ['Supporting documents must be verified before approval'],
    entryFieldsToFill: ['Submitted during registration review (not on entry form)'],
  }
}

const FIELD_BUILDERS: Record<
  EligibilityFieldKey,
  (
    context: EntryFormEligibilityContext,
    policy: DerbyEligibilityPolicyRow | null
  ) => EligibilityPolicySummaryItem
> = {
  age_class: (context) => buildAgeClassItem(context),
  weight: (context) => buildWeightItem(context),
  banding: (context, policy) => buildBandingItem(context, policy),
  documents: () => buildDocumentsItem(),
}

export function buildEligibilityPolicySummary(
  context: EntryFormEligibilityContext,
  policy: DerbyEligibilityPolicyRow | null,
  _associationNames: string[] = []
): EligibilityPolicySummary {
  const items = context.enabledFields.map((field) =>
    FIELD_BUILDERS[field](context, policy)
  )

  const workflowNotes: string[] = []

  if (context.physicalInspectionRequired) {
    workflowNotes.push('Physical inspection required')
  }
  if (
    context.documentVerificationRequired &&
    !isEligibilityFieldEnabled(context.enabledFields, 'documents')
  ) {
    workflowNotes.push('Document verification required')
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

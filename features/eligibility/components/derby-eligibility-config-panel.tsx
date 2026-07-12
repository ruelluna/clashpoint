'use client'

import {
  Box,
  Button,
  Checkbox,
  Flex,
  Input,
  NativeSelect,
  Stack,
  Switch,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useActionState, useMemo, useState } from 'react'

import { FormField, LAYOUT_GAP, PanelCard } from '@/components/dashboard'
import { OptionListField } from '@/components/dashboard/option-list-field'
import type { AssociationListItem } from '@/features/associations/queries'
import {
  upsertEligibilityPolicyAction,
  type EligibilityActionState,
} from '@/features/eligibility/actions'
import type { DerbyEligibilityPolicyRow } from '@/features/eligibility/queries'
import {
  AGE_CLASS_PRESETS,
  BAND_LEVEL_PRESETS,
  BREEDING_RELATIONSHIP_PRESETS,
  ELIGIBILITY_FIELD_DESCRIPTIONS,
  ELIGIBILITY_FIELD_KEYS,
  ELIGIBILITY_FIELD_LABELS,
  EXPERIENCE_STATUS_PRESETS,
  ORIGIN_TYPE_PRESETS,
  type EligibilityFieldKey,
} from '@/lib/derby/eligibility-fields'

type DerbyEligibilityConfigPanelProps = {
  mode: 'embedded' | 'standalone'
  eventId?: string
  canManage: boolean
  eligibilityEnforcementEnabled: boolean
  policy: DerbyEligibilityPolicyRow | null
  associations: AssociationListItem[]
  entryFee?: number
}

const initialState: EligibilityActionState = {}

type FieldState = {
  enabledFields: Set<EligibilityFieldKey>
  policyStatus: string
  eligibilityEnforcementEnabled: boolean
  allowedAgeClasses: string[]
  minimumWeightGrams: string
  maximumWeightGrams: string
  weightVerificationRequired: boolean
  bandingRequired: boolean
  allowUnbanded: boolean
  bandVerificationRequired: boolean
  acceptedBandLevels: string[]
  acceptedBandOrganizations: string[]
  acceptedBandYears: string[]
  acceptedBandSeasons: string[]
  allowedExperienceStatuses: string[]
  allowedOriginTypes: string[]
  allowedBreedingRelationships: string[]
  associationMembersOnly: boolean
  approvedAssociationIds: string[]
  locallyBredOnly: boolean
  importedAllowed: boolean
  originVerificationRequired: boolean
  physicalInspectionRequired: boolean
  documentVerificationRequired: boolean
  entryFeePaymentRequired: boolean
  unknownValueHandling: string
  eligibilityNotes: string
}

function buildInitialState(
  policy: DerbyEligibilityPolicyRow | null,
  eligibilityEnforcementEnabled: boolean
): FieldState {
  return {
    enabledFields: new Set(
      (policy?.enabled_eligibility_fields ?? []).filter((field): field is EligibilityFieldKey =>
        ELIGIBILITY_FIELD_KEYS.includes(field as EligibilityFieldKey)
      )
    ),
    policyStatus: policy?.policy_status ?? 'draft',
    eligibilityEnforcementEnabled,
    allowedAgeClasses: policy?.allowed_age_classes ?? [],
    minimumWeightGrams:
      policy?.minimum_weight_grams != null ? String(policy.minimum_weight_grams) : '',
    maximumWeightGrams:
      policy?.maximum_weight_grams != null ? String(policy.maximum_weight_grams) : '',
    weightVerificationRequired: policy?.weight_verification_required ?? false,
    bandingRequired: policy?.banding_required ?? false,
    allowUnbanded: policy?.allow_unbanded ?? true,
    bandVerificationRequired: policy?.band_verification_required ?? false,
    acceptedBandLevels: policy?.accepted_band_levels ?? [],
    acceptedBandOrganizations: policy?.accepted_band_organizations ?? [],
    acceptedBandYears: (policy?.accepted_band_years ?? []).map(String),
    acceptedBandSeasons: policy?.accepted_band_seasons ?? [],
    allowedExperienceStatuses: policy?.allowed_experience_statuses ?? [],
    allowedOriginTypes: policy?.allowed_origin_types ?? [],
    allowedBreedingRelationships: policy?.allowed_breeding_relationships ?? [],
    associationMembersOnly: policy?.association_members_only ?? false,
    approvedAssociationIds: policy?.approved_association_ids ?? [],
    locallyBredOnly: policy?.locally_bred_only ?? false,
    importedAllowed: policy?.imported_allowed ?? true,
    originVerificationRequired: policy?.origin_verification_required ?? false,
    physicalInspectionRequired: policy?.physical_inspection_required ?? false,
    documentVerificationRequired: policy?.document_verification_required ?? false,
    entryFeePaymentRequired: policy?.entry_fee_payment_required ?? false,
    unknownValueHandling: policy?.unknown_value_handling ?? 'approval_required',
    eligibilityNotes: policy?.eligibility_notes ?? '',
  }
}

function BooleanHiddenInput({ name, checked }: { name: string; checked: boolean }) {
  return <input type="hidden" name={name} value={checked ? 'on' : 'off'} />
}

function PolicyCheckbox({
  checked,
  onCheckedChange,
  children,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Checkbox.Root
      checked={checked}
      onCheckedChange={(event) => {
        onCheckedChange(Boolean(event.checked))
      }}
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control />
      <Checkbox.Label>{children}</Checkbox.Label>
    </Checkbox.Root>
  )
}

function formatEntryFee(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

function FieldToggle({
  field,
  enabled,
  onToggle,
  children,
}: {
  field: EligibilityFieldKey
  enabled: boolean
  onToggle: (checked: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Box borderWidth="1px" borderColor="border" rounded="md" p={4}>
      <Flex justify="space-between" align="flex-start" gap={4} mb={enabled ? 3 : 0}>
        <Box flex="1">
          <Text fontWeight="medium">{ELIGIBILITY_FIELD_LABELS[field]}</Text>
          <Text fontSize="sm" color="fg.muted">
            {ELIGIBILITY_FIELD_DESCRIPTIONS[field]}
          </Text>
        </Box>
        <Switch.Root checked={enabled} onCheckedChange={(event) => onToggle(event.checked)}>
          <Switch.HiddenInput />
          <Switch.Control />
        </Switch.Root>
      </Flex>
      {enabled ? <Stack gap={3}>{children}</Stack> : null}
    </Box>
  )
}

function DerbyEligibilityFields({
  state,
  eventId,
  associations,
  mode,
  entryFee,
  toggleField,
  patchState,
  toggleAssociation,
}: {
  state: FieldState
  eventId?: string
  associations: AssociationListItem[]
  mode: 'embedded' | 'standalone'
  entryFee?: number
  toggleField: (field: EligibilityFieldKey, checked: boolean) => void
  patchState: (patch: Partial<FieldState>) => void
  toggleAssociation: (associationId: string, checked: boolean) => void
}) {
  const enabledFieldList = useMemo(
    () => ELIGIBILITY_FIELD_KEYS.filter((field) => state.enabledFields.has(field)),
    [state.enabledFields]
  )

  return (
    <Stack gap={LAYOUT_GAP.form}>
      {eventId ? <input type="hidden" name="eventId" value={eventId} /> : null}
      {enabledFieldList.map((field) => (
        <input key={field} type="hidden" name="enabledFields" value={field} />
      ))}

      <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', md: 'row' }}>
        <FormField label="Policy status" flex="1">
          <NativeSelect.Root>
            <NativeSelect.Field
              name="policyStatus"
              value={state.policyStatus}
              onChange={(event) => patchState({ policyStatus: event.currentTarget.value })}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              <option value="archived">Archived</option>
            </NativeSelect.Field>
          </NativeSelect.Root>
        </FormField>
        <FormField label="Unknown values" flex="1">
          <NativeSelect.Root>
            <NativeSelect.Field
              name="unknownValueHandling"
              value={state.unknownValueHandling}
              onChange={(event) =>
                patchState({ unknownValueHandling: event.currentTarget.value })
              }
            >
              <option value="allow">Allow</option>
              <option value="approval_required">Require approval</option>
              <option value="prohibit">Prohibit</option>
            </NativeSelect.Field>
          </NativeSelect.Root>
        </FormField>
      </Flex>

      <BooleanHiddenInput
        name="eligibilityEnforcementEnabled"
        checked={state.eligibilityEnforcementEnabled}
      />
      <PolicyCheckbox
        checked={state.eligibilityEnforcementEnabled}
        onCheckedChange={(checked) => patchState({ eligibilityEnforcementEnabled: checked })}
      >
        Enforce eligibility during registration review
      </PolicyCheckbox>

      <FieldToggle
        field="age_class"
        enabled={state.enabledFields.has('age_class')}
        onToggle={(checked) => toggleField('age_class', checked)}
      >
        <OptionListField
          name="allowedAgeClasses"
          label="Allowed age classes"
          helpText="Only roosters in these classes may enter."
          values={state.allowedAgeClasses}
          onChange={(allowedAgeClasses) => patchState({ allowedAgeClasses })}
          presets={AGE_CLASS_PRESETS}
        />
      </FieldToggle>

      <FieldToggle
        field="weight"
        enabled={state.enabledFields.has('weight')}
        onToggle={(checked) => toggleField('weight', checked)}
      >
        <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', md: 'row' }}>
          <FormField label="Minimum weight (grams)" flex="1">
            <Input
              name="minimumWeightGrams"
              type="number"
              min={0}
              value={state.minimumWeightGrams}
              onChange={(event) => patchState({ minimumWeightGrams: event.target.value })}
            />
          </FormField>
          <FormField label="Maximum weight (grams)" flex="1">
            <Input
              name="maximumWeightGrams"
              type="number"
              min={0}
              value={state.maximumWeightGrams}
              onChange={(event) => patchState({ maximumWeightGrams: event.target.value })}
            />
          </FormField>
        </Flex>
        <BooleanHiddenInput
          name="weightVerificationRequired"
          checked={state.weightVerificationRequired}
        />
        <PolicyCheckbox
          checked={state.weightVerificationRequired}
          onCheckedChange={(checked) => patchState({ weightVerificationRequired: checked })}
        >
          Require official weight verification
        </PolicyCheckbox>
      </FieldToggle>

      <FieldToggle
        field="banding"
        enabled={state.enabledFields.has('banding')}
        onToggle={(checked) => toggleField('banding', checked)}
      >
        <Flex direction="column" gap={2}>
          <BooleanHiddenInput name="bandingRequired" checked={state.bandingRequired} />
          <PolicyCheckbox
            checked={state.bandingRequired}
            onCheckedChange={(checked) => patchState({ bandingRequired: checked })}
          >
            Band is required
          </PolicyCheckbox>
          <BooleanHiddenInput name="allowUnbanded" checked={state.allowUnbanded} />
          <PolicyCheckbox
            checked={state.allowUnbanded}
            onCheckedChange={(checked) => patchState({ allowUnbanded: checked })}
          >
            Allow unbanded entries (with approval)
          </PolicyCheckbox>
          <BooleanHiddenInput
            name="bandVerificationRequired"
            checked={state.bandVerificationRequired}
          />
          <PolicyCheckbox
            checked={state.bandVerificationRequired}
            onCheckedChange={(checked) => patchState({ bandVerificationRequired: checked })}
          >
            Require verified bands
          </PolicyCheckbox>
        </Flex>
        <OptionListField
          name="acceptedBandLevels"
          label="Accepted band levels"
          values={state.acceptedBandLevels}
          onChange={(acceptedBandLevels) => patchState({ acceptedBandLevels })}
          presets={BAND_LEVEL_PRESETS}
        />
        <OptionListField
          name="acceptedBandOrganizations"
          label="Accepted band organizations"
          helpText="Add organization names exactly as they appear on bands."
          values={state.acceptedBandOrganizations}
          onChange={(acceptedBandOrganizations) =>
            patchState({ acceptedBandOrganizations })
          }
          placeholder="Organization name"
        />
        <OptionListField
          name="acceptedBandYears"
          label="Accepted band years"
          values={state.acceptedBandYears}
          onChange={(acceptedBandYears) => patchState({ acceptedBandYears })}
          inputType="number"
          placeholder="Year"
        />
        <OptionListField
          name="acceptedBandSeasons"
          label="Accepted band seasons"
          values={state.acceptedBandSeasons}
          onChange={(acceptedBandSeasons) => patchState({ acceptedBandSeasons })}
          placeholder="Season label"
        />
      </FieldToggle>

      <FieldToggle
        field="experience"
        enabled={state.enabledFields.has('experience')}
        onToggle={(checked) => toggleField('experience', checked)}
      >
        <OptionListField
          name="allowedExperienceStatuses"
          label="Allowed experience statuses"
          values={state.allowedExperienceStatuses}
          onChange={(allowedExperienceStatuses) => patchState({ allowedExperienceStatuses })}
          presets={EXPERIENCE_STATUS_PRESETS}
        />
      </FieldToggle>

      <FieldToggle
        field="origin"
        enabled={state.enabledFields.has('origin')}
        onToggle={(checked) => toggleField('origin', checked)}
      >
        <Flex direction="column" gap={2}>
          <BooleanHiddenInput name="locallyBredOnly" checked={state.locallyBredOnly} />
          <PolicyCheckbox
            checked={state.locallyBredOnly}
            onCheckedChange={(checked) => patchState({ locallyBredOnly: checked })}
          >
            Locally bred only
          </PolicyCheckbox>
          <BooleanHiddenInput name="importedAllowed" checked={state.importedAllowed} />
          <PolicyCheckbox
            checked={state.importedAllowed}
            onCheckedChange={(checked) => patchState({ importedAllowed: checked })}
          >
            Allow imported roosters
          </PolicyCheckbox>
          <BooleanHiddenInput
            name="originVerificationRequired"
            checked={state.originVerificationRequired}
          />
          <PolicyCheckbox
            checked={state.originVerificationRequired}
            onCheckedChange={(checked) =>
              patchState({ originVerificationRequired: checked })
            }
          >
            Require origin verification
          </PolicyCheckbox>
        </Flex>
        <OptionListField
          name="allowedOriginTypes"
          label="Allowed origin types"
          values={state.allowedOriginTypes}
          onChange={(allowedOriginTypes) => patchState({ allowedOriginTypes })}
          presets={ORIGIN_TYPE_PRESETS}
        />
        <OptionListField
          name="allowedBreedingRelationships"
          label="Allowed breeding relationships"
          values={state.allowedBreedingRelationships}
          onChange={(allowedBreedingRelationships) =>
            patchState({ allowedBreedingRelationships })
          }
          presets={BREEDING_RELATIONSHIP_PRESETS}
        />
      </FieldToggle>

      <FieldToggle
        field="association"
        enabled={state.enabledFields.has('association')}
        onToggle={(checked) => toggleField('association', checked)}
      >
        <BooleanHiddenInput
          name="associationMembersOnly"
          checked={state.associationMembersOnly}
        />
        <PolicyCheckbox
          checked={state.associationMembersOnly}
          onCheckedChange={(checked) => patchState({ associationMembersOnly: checked })}
        >
          Require association membership
        </PolicyCheckbox>
        {state.approvedAssociationIds.map((associationId) => (
          <input
            key={associationId}
            type="hidden"
            name="approvedAssociationIds"
            value={associationId}
          />
        ))}
        {associations.length > 0 ? (
          <Stack gap={2}>
            <Text fontSize="sm" fontWeight="medium">
              Approved associations
            </Text>
            {associations.map((association) => (
              <PolicyCheckbox
                key={association.id}
                checked={state.approvedAssociationIds.includes(association.id)}
                onCheckedChange={(checked) => toggleAssociation(association.id, checked)}
              >
                {association.name}
                {association.code ? ` (${association.code})` : ''}
              </PolicyCheckbox>
            ))}
          </Stack>
        ) : (
          <Text fontSize="sm" color="fg.muted">
            No associations in the registry yet. Add associations first, then select them here.
          </Text>
        )}
      </FieldToggle>

      <FieldToggle
        field="inspection"
        enabled={state.enabledFields.has('inspection')}
        onToggle={(checked) => toggleField('inspection', checked)}
      >
        <BooleanHiddenInput
          name="physicalInspectionRequired"
          checked={state.physicalInspectionRequired}
        />
        <PolicyCheckbox
          checked={state.physicalInspectionRequired}
          onCheckedChange={(checked) => patchState({ physicalInspectionRequired: checked })}
        >
          Physical inspection required before matching
        </PolicyCheckbox>
      </FieldToggle>

      <FieldToggle
        field="documents"
        enabled={state.enabledFields.has('documents')}
        onToggle={(checked) => toggleField('documents', checked)}
      >
        <BooleanHiddenInput
          name="documentVerificationRequired"
          checked={state.documentVerificationRequired}
        />
        <PolicyCheckbox
          checked={state.documentVerificationRequired}
          onCheckedChange={(checked) =>
            patchState({ documentVerificationRequired: checked })
          }
        >
          Document verification required in registration workflow
        </PolicyCheckbox>
      </FieldToggle>

      <FieldToggle
        field="payment"
        enabled={state.enabledFields.has('payment')}
        onToggle={(checked) => toggleField('payment', checked)}
      >
        <BooleanHiddenInput
          name="entryFeePaymentRequired"
          checked={state.entryFeePaymentRequired}
        />
        <PolicyCheckbox
          checked={state.entryFeePaymentRequired}
          onCheckedChange={(checked) => patchState({ entryFeePaymentRequired: checked })}
        >
          Registration fee must be paid before approval
        </PolicyCheckbox>
        <Text fontSize="sm" color="fg.muted">
          {mode === 'embedded'
            ? 'Uses the registration entry fee set on this form.'
            : `Current entry fee: ${formatEntryFee(entryFee ?? 0)} (edit on the event form above).`}
        </Text>
      </FieldToggle>

      <FormField label="Eligibility notes">
        <Textarea
          name="eligibilityNotes"
          rows={3}
          value={state.eligibilityNotes}
          onChange={(event) => patchState({ eligibilityNotes: event.target.value })}
        />
      </FormField>
    </Stack>
  )
}

export function DerbyEligibilityConfigPanel({
  mode,
  eventId,
  canManage,
  eligibilityEnforcementEnabled,
  policy,
  associations,
  entryFee,
}: DerbyEligibilityConfigPanelProps) {
  const [state, setState] = useState<FieldState>(() =>
    buildInitialState(policy, eligibilityEnforcementEnabled)
  )
  const [formState, formAction, pending] = useActionState(
    upsertEligibilityPolicyAction,
    initialState
  )

  function toggleField(field: EligibilityFieldKey, checked: boolean) {
    setState((current) => {
      const enabledFields = new Set(current.enabledFields)
      if (checked) {
        enabledFields.add(field)
      } else {
        enabledFields.delete(field)
      }
      return { ...current, enabledFields }
    })
  }

  function patchState(patch: Partial<FieldState>) {
    setState((current) => ({ ...current, ...patch }))
  }

  function toggleAssociation(associationId: string, checked: boolean) {
    setState((current) => {
      const approvedAssociationIds = checked
        ? [...current.approvedAssociationIds, associationId]
        : current.approvedAssociationIds.filter((id) => id !== associationId)
      return { ...current, approvedAssociationIds }
    })
  }

  if (!canManage) {
    if (mode === 'embedded') return null

    return (
      <PanelCard title="Derby eligibility rules">
        <Text color="fg.muted" fontSize="sm">
          You do not have permission to configure eligibility rules for this event.
        </Text>
      </PanelCard>
    )
  }

  const intro = (
    <Text fontSize="sm" color="fg.muted" mb={4}>
      Optional rules for derby events. Enable a field, then add the accepted options for that
      field. Disabled fields are not enforced during registration review.
    </Text>
  )

  const fields = (
    <DerbyEligibilityFields
      state={state}
      eventId={eventId}
      associations={associations}
      mode={mode}
      entryFee={entryFee}
      toggleField={toggleField}
      patchState={patchState}
      toggleAssociation={toggleAssociation}
    />
  )

  if (mode === 'embedded') {
    return (
      <Box>
        <Text fontSize="md" fontWeight="semibold" mb={1}>
          Derby eligibility rules
        </Text>
        {intro}
        {fields}
      </Box>
    )
  }

  return (
    <PanelCard title="Derby eligibility rules" flush>
      <Box p={4}>
        {intro}
        <form action={formAction}>
          {fields}
          <Button type="submit" loading={pending} alignSelf="flex-start" mt={4}>
            Save eligibility settings
          </Button>
          {formState.error ? (
            <Text color="fg.error" fontSize="sm" mt={2}>
              {formState.error}
            </Text>
          ) : null}
          {formState.success ? (
            <Text color="fg.success" fontSize="sm" mt={2}>
              {formState.success}
            </Text>
          ) : null}
        </form>
      </Box>
    </PanelCard>
  )
}

'use client'

import { Flex, Input, NativeSelect, Stack, Text } from '@chakra-ui/react'

import { FormField, LAYOUT_GAP } from '@/components/dashboard'
import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'
import {
  ELIGIBILITY_FIELD_LABELS,
  isEligibilityFieldEnabled,
} from '@/lib/derby/eligibility-fields'
import { gramsToKg } from '@/lib/derby/enums'

type RoosterPolicyFieldsProps = {
  eligibilityContext: EntryFormEligibilityContext | null
  fieldPrefix?: string
  disabled?: boolean
  defaults?: {
    ageClass?: string
    originType?: string
    breedingRelationship?: string
    experienceStatus?: string
    bandLevel?: string
    bandOrganization?: string
    bandYear?: number | null
    bandSeason?: string
    colorMarking?: string
    category?: string
  }
}

function fieldName(prefix: string, name: string) {
  return prefix ? `${name}_${prefix}` : name
}

function formatPolicyWeightRange(context: EntryFormEligibilityContext | null) {
  if (!context) return null
  if (
    !isEligibilityFieldEnabled(context.enabledFields, 'weight') ||
    (context.minimumWeightGrams == null && context.maximumWeightGrams == null)
  ) {
    return null
  }
  return `${gramsToKg(context.minimumWeightGrams)} – ${gramsToKg(context.maximumWeightGrams)} kg (event policy)`
}

export function RoosterPolicyFields({
  eligibilityContext,
  fieldPrefix = '',
  disabled = false,
  defaults,
}: RoosterPolicyFieldsProps) {
  const policyWeightRange = formatPolicyWeightRange(eligibilityContext)

  if (!eligibilityContext) {
    return (
      <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
        <FormField label="Category" flex="1">
          <Input
            name={fieldName(fieldPrefix, 'category')}
            maxLength={100}
            defaultValue={defaults?.category ?? ''}
            disabled={disabled}
          />
        </FormField>
        <FormField label="Color / marking" flex="1">
          <Input
            name={fieldName(fieldPrefix, 'colorMarking')}
            maxLength={200}
            defaultValue={defaults?.colorMarking ?? ''}
            disabled={disabled}
          />
        </FormField>
      </Flex>
    )
  }

  const ageRequired =
    isEligibilityFieldEnabled(eligibilityContext.enabledFields, 'age_class') &&
    eligibilityContext.unknownValueHandling === 'prohibit'

  return (
    <Stack gap={LAYOUT_GAP.form}>
      {policyWeightRange ? (
        <Text fontSize="sm" color="fg.muted">
          {ELIGIBILITY_FIELD_LABELS.weight}: {policyWeightRange}
        </Text>
      ) : null}

      {isEligibilityFieldEnabled(eligibilityContext.enabledFields, 'age_class') ? (
        <FormField label="Age class" required={ageRequired}>
          <NativeSelect.Root disabled={disabled}>
            <NativeSelect.Field
              name={fieldName(fieldPrefix, 'ageClass')}
              defaultValue={defaults?.ageClass ?? ''}
            >
              <option value="">Select age class</option>
              {eligibilityContext.allowedAgeClasses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </FormField>
      ) : (
        <FormField label="Category">
          <Input
            name={fieldName(fieldPrefix, 'category')}
            maxLength={100}
            defaultValue={defaults?.category ?? ''}
            disabled={disabled}
          />
        </FormField>
      )}

      {isEligibilityFieldEnabled(eligibilityContext.enabledFields, 'experience') ? (
        <FormField label="Experience">
          <NativeSelect.Root disabled={disabled}>
            <NativeSelect.Field
              name={fieldName(fieldPrefix, 'experienceStatus')}
              defaultValue={defaults?.experienceStatus ?? ''}
            >
              <option value="">Select experience</option>
              {eligibilityContext.allowedExperienceStatuses.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </FormField>
      ) : null}

      {isEligibilityFieldEnabled(eligibilityContext.enabledFields, 'origin') ? (
        <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
          <FormField label="Origin type" flex="1">
            <NativeSelect.Root disabled={disabled}>
              <NativeSelect.Field
                name={fieldName(fieldPrefix, 'originType')}
                defaultValue={defaults?.originType ?? ''}
              >
                <option value="">Select origin</option>
                {eligibilityContext.allowedOriginTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </FormField>
          <FormField label="Breeding relationship" flex="1">
            <NativeSelect.Root disabled={disabled}>
              <NativeSelect.Field
                name={fieldName(fieldPrefix, 'breedingRelationship')}
                defaultValue={defaults?.breedingRelationship ?? ''}
              >
                <option value="">Select breeding</option>
                {eligibilityContext.allowedBreedingRelationships.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </FormField>
        </Flex>
      ) : null}

      {isEligibilityFieldEnabled(eligibilityContext.enabledFields, 'banding') ? (
        <>
          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <FormField
              label="Band level"
              flex="1"
              required={eligibilityContext.bandingRequired}
            >
              <NativeSelect.Root disabled={disabled}>
                <NativeSelect.Field
                  name={fieldName(fieldPrefix, 'bandLevel')}
                  defaultValue={defaults?.bandLevel ?? ''}
                >
                  <option value="">Select band level</option>
                  {(eligibilityContext.acceptedBandLevels.length > 0
                    ? eligibilityContext.acceptedBandLevels
                    : [{ value: 'local', label: 'Local' }]
                  ).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </FormField>
            <FormField label="Band organization" flex="1">
              {eligibilityContext.acceptedBandOrganizations.length > 0 ? (
                <NativeSelect.Root disabled={disabled}>
                  <NativeSelect.Field
                    name={fieldName(fieldPrefix, 'bandOrganization')}
                    defaultValue={defaults?.bandOrganization ?? ''}
                  >
                    <option value="">Select organization</option>
                    {eligibilityContext.acceptedBandOrganizations.map((org) => (
                      <option key={org} value={org}>
                        {org}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              ) : (
                <Input
                  name={fieldName(fieldPrefix, 'bandOrganization')}
                  maxLength={200}
                  defaultValue={defaults?.bandOrganization ?? ''}
                  disabled={disabled}
                />
              )}
            </FormField>
          </Flex>
          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <FormField label="Band year" flex="1">
              {eligibilityContext.acceptedBandYears.length > 0 ? (
                <NativeSelect.Root disabled={disabled}>
                  <NativeSelect.Field
                    name={fieldName(fieldPrefix, 'bandYear')}
                    defaultValue={
                      defaults?.bandYear != null ? String(defaults.bandYear) : ''
                    }
                  >
                    <option value="">Select year</option>
                    {eligibilityContext.acceptedBandYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              ) : (
                <Input
                  name={fieldName(fieldPrefix, 'bandYear')}
                  type="number"
                  min={1900}
                  max={2100}
                  defaultValue={defaults?.bandYear ?? ''}
                  disabled={disabled}
                />
              )}
            </FormField>
            <FormField label="Band season" flex="1">
              {eligibilityContext.acceptedBandSeasons.length > 0 ? (
                <NativeSelect.Root disabled={disabled}>
                  <NativeSelect.Field
                    name={fieldName(fieldPrefix, 'bandSeason')}
                    defaultValue={defaults?.bandSeason ?? ''}
                  >
                    <option value="">Select season</option>
                    {eligibilityContext.acceptedBandSeasons.map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              ) : (
                <Input
                  name={fieldName(fieldPrefix, 'bandSeason')}
                  maxLength={100}
                  defaultValue={defaults?.bandSeason ?? ''}
                  disabled={disabled}
                />
              )}
            </FormField>
          </Flex>
        </>
      ) : null}

      <FormField label="Color / marking">
        <Input
          name={fieldName(fieldPrefix, 'colorMarking')}
          maxLength={200}
          defaultValue={defaults?.colorMarking ?? ''}
          disabled={disabled}
        />
      </FormField>

      {eligibilityContext.associationMembersOnly ? (
        <Text fontSize="sm" color="fg.muted">
          Association membership is required for this event. Link the owner to a saved
          competitor with approved associations before approval.
        </Text>
      ) : null}
    </Stack>
  )
}

export function EligibilityStatusSummary({
  status,
  checks,
}: {
  status: string | null
  checks?: Array<{ message: string; outcome: string; passed: boolean }>
}) {
  if (!status) return null

  const failedChecks = (checks ?? []).filter((check) => check.outcome === 'fail')

  return (
    <Stack gap={1}>
      <Text fontSize="sm" fontWeight="medium">
        Eligibility: {status.replaceAll('_', ' ')}
      </Text>
      {failedChecks.map((check) => (
        <Text key={check.message} fontSize="sm" color="red.500">
          {check.message}
        </Text>
      ))}
    </Stack>
  )
}

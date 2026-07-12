'use client'

import { Flex, Input, Text } from '@chakra-ui/react'

import { FormField, LAYOUT_GAP, PanelCard } from '@/components/dashboard'
import {
  EligibilityStatusSummary,
  RoosterPolicyFields,
} from '@/features/entries/components/rooster-policy-fields'
import type { EntryRoosterEditItem } from '@/features/entries/queries'
import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'

type RoosterEntrySlotsProps = {
  mode: 'create' | 'edit'
  eventType: 'classic' | 'derby'
  cocksPerEntry: number
  eligibilityContext?: EntryFormEligibilityContext | null
  existingRoosters?: EntryRoosterEditItem[]
}

function fieldPrefixForCreate(cockIndex: number) {
  return `rooster_${cockIndex}_`
}

function fieldPrefixForNewEdit(cockIndex: number) {
  return `new_rooster_${cockIndex}_`
}

function fieldPrefixForExistingEdit(roosterId: string) {
  return `${roosterId}_`
}

type RoosterSlotFieldsProps = {
  prefix: string
  cockNumber: number
  title: string
  required?: boolean
  disabled?: boolean
  eligibilityContext?: EntryFormEligibilityContext | null
  defaults?: EntryRoosterEditItem
  fieldPrefixForPolicy: string
  namePrefix?: string
}

function RoosterSlotFields({
  prefix,
  cockNumber,
  title,
  required = false,
  disabled = false,
  eligibilityContext = null,
  defaults,
  fieldPrefixForPolicy,
  namePrefix = '',
}: RoosterSlotFieldsProps) {
  const entryNameField = namePrefix
    ? `entryName_${namePrefix}`
    : `${prefix}entryName`
  const bandField = namePrefix ? `bandNumber_${namePrefix}` : `${prefix}bandNumber`
  const weightField = namePrefix ? `weight_${namePrefix}` : `${prefix}weight`

  return (
    <PanelCard>
      <Text fontSize="sm" fontWeight="medium" mb={3}>
        {title}
        {disabled ? (
          <Text as="span" fontSize="xs" color="fg.muted" fontWeight="normal" ml={2}>
            (in a match — rooster details locked)
          </Text>
        ) : null}
      </Text>
      <input type="hidden" name={`${prefix}cockNumber`} value={cockNumber} />
      <FormField label="Entry name" required={required}>
        <Input
          name={entryNameField}
          required={required}
          maxLength={200}
          defaultValue={defaults?.rooster_name ?? ''}
          disabled={disabled}
        />
      </FormField>
      <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
        <FormField label="Band number" required={required} flex="1">
          <Input
            name={bandField}
            required={required}
            maxLength={50}
            defaultValue={defaults?.band_number ?? ''}
            disabled={disabled}
          />
        </FormField>
        <FormField label="Weight (kg)" required={required} flex="1">
          <Input
            name={weightField}
            type="number"
            step="0.01"
            min="0"
            required={required}
            defaultValue={
              defaults?.weight != null ? String(defaults.weight) : undefined
            }
            disabled={disabled}
          />
        </FormField>
      </Flex>
      <RoosterPolicyFields
        eligibilityContext={eligibilityContext}
        fieldPrefix={fieldPrefixForPolicy}
        disabled={disabled}
        defaults={{
          ageClass: defaults?.age_class ?? undefined,
          category: defaults?.category ?? undefined,
          colorMarking: defaults?.color_marking ?? undefined,
          originType: defaults?.origin_type ?? undefined,
          breedingRelationship: defaults?.breeding_relationship ?? undefined,
          experienceStatus: defaults?.experience_status ?? undefined,
          bandLevel: defaults?.band_level ?? undefined,
          bandOrganization: defaults?.band_organization ?? undefined,
          bandYear: defaults?.band_year,
          bandSeason: defaults?.band_season ?? undefined,
        }}
      />
      {defaults?.eligibility_status ? (
        <EligibilityStatusSummary
          status={defaults.eligibility_status}
          checks={defaults.eligibility_checks}
        />
      ) : null}
    </PanelCard>
  )
}

export function RoosterEntrySlots({
  mode,
  eventType,
  cocksPerEntry,
  eligibilityContext = null,
  existingRoosters = [],
}: RoosterEntrySlotsProps) {
  const slotCount = eventType === 'classic' ? 1 : cocksPerEntry

  if (mode === 'create') {
    return (
      <>
        <input type="hidden" name="roosterSlotCount" value={slotCount} />
        {Array.from({ length: slotCount }, (_, index) => {
          const cockNumber = index + 1
          const isClassic = eventType === 'classic'
          return (
            <RoosterSlotFields
              key={cockNumber}
              prefix={fieldPrefixForCreate(cockNumber)}
              cockNumber={cockNumber}
              title={isClassic ? 'Rooster & weight' : `Cock #${cockNumber}`}
              required={isClassic}
              eligibilityContext={eligibilityContext}
              fieldPrefixForPolicy={`rooster_${cockNumber}`}
            />
          )
        })}
        {eventType === 'derby' ? (
          <Text fontSize="sm" color="fg.muted">
            Fill at least one cock to save. You can add remaining cocks later from Edit entry.
          </Text>
        ) : null}
      </>
    )
  }

  const existingByCock = new Map(
    existingRoosters.map((rooster) => [rooster.cock_number, rooster])
  )
  const missingSlots: number[] = []

  for (let cockNumber = 1; cockNumber <= cocksPerEntry; cockNumber += 1) {
    if (!existingByCock.has(cockNumber)) {
      missingSlots.push(cockNumber)
    }
  }

  return (
    <>
      {existingRoosters.map((rooster) => (
        <RoosterSlotFields
          key={rooster.rooster_id}
          prefix=""
          cockNumber={rooster.cock_number}
          title={`Cock #${rooster.cock_number}`}
          required
          disabled={rooster.is_paired}
          eligibilityContext={eligibilityContext}
          defaults={rooster}
          fieldPrefixForPolicy={fieldPrefixForExistingEdit(rooster.rooster_id)}
          namePrefix={rooster.rooster_id}
        />
      ))}
      {missingSlots.map((cockNumber) => (
        <RoosterSlotFields
          key={`new-${cockNumber}`}
          prefix={fieldPrefixForNewEdit(cockNumber)}
          cockNumber={cockNumber}
          title={`New cock #${cockNumber}`}
          eligibilityContext={eligibilityContext}
          fieldPrefixForPolicy={`new_rooster_${cockNumber}`}
        />
      ))}
    </>
  )
}

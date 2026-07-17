'use client'

import { Flex, Input, Text } from '@chakra-ui/react'

import { FormField, LAYOUT_GAP, PanelCard } from '@/components/dashboard'
import { GramWeightInput } from '@/features/entries/components/gram-weight-input'
import { RoosterEntryCoreFields } from '@/features/entries/components/rooster-entry-core-fields'
import {
  EligibilityStatusSummary,
  RoosterPolicyFields,
} from '@/features/entries/components/rooster-policy-fields'
import { isBandNumberRequiredForEvent } from '@/features/entries/schema'
import type { EntryRoosterEditItem } from '@/features/entries/queries'
import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'
import type { RoosterEntryCatalog, PublicReferenceOptions } from '@/features/reference-values/catalog'
import { RoosterProfileFields } from '@/features/roosters/components/rooster-profile-fields'

type RoosterEntrySlotsProps = {
  mode: 'create' | 'edit'
  eventType: 'classic' | 'derby'
  cocksPerEntry: number
  catalog: RoosterEntryCatalog
  publicReferenceOptions?: PublicReferenceOptions | null
  requireAllSlots?: boolean
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
  mode: 'create' | 'edit'
  prefix: string
  slotKey: string
  cockNumber: number
  title: string
  required?: boolean
  disabled?: boolean
  eligibilityContext?: EntryFormEligibilityContext | null
  defaults?: EntryRoosterEditItem
  fieldPrefixForPolicy: string
  namePrefix?: string
  bandNumberRequired?: boolean
  catalog: RoosterEntryCatalog
  allowBreedCreate?: boolean
  allowColorCreate?: boolean
}

function handlerFieldName(mode: 'create' | 'edit', slotKey: string) {
  if (mode === 'create') {
    return `handlerName_rooster_${slotKey}`
  }
  return `handlerName_${slotKey}`
}

function RoosterSlotFields({
  mode,
  prefix,
  slotKey,
  cockNumber,
  title,
  required = false,
  disabled = false,
  eligibilityContext = null,
  defaults,
  fieldPrefixForPolicy,
  namePrefix = '',
  bandNumberRequired = true,
  catalog,
  allowBreedCreate = false,
  allowColorCreate = false,
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
      <FormField label="Rooster name" required={required}>
        <Input
          name={entryNameField}
          required={required}
          maxLength={200}
          defaultValue={defaults?.rooster_name ?? ''}
          disabled={disabled}
        />
      </FormField>
      <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
        <FormField label="Band number" required={required && bandNumberRequired} flex="1">
          <Input
            name={bandField}
            required={required && bandNumberRequired}
            maxLength={50}
            defaultValue={defaults?.band_number ?? ''}
            disabled={disabled}
          />
        </FormField>
        <FormField label="Weight (g)" required={required} flex="1">
          <GramWeightInput
            name={weightField}
            required={required}
            defaultValue={
              defaults?.weight != null ? String(defaults.weight) : undefined
            }
            disabled={disabled}
          />
        </FormField>
      </Flex>
      <FormField label="Handler name" required={required}>
        <Input
          name={handlerFieldName(mode, slotKey)}
          maxLength={200}
          required={required}
          defaultValue={defaults?.handler_name ?? ''}
          disabled={disabled}
        />
      </FormField>
      <RoosterEntryCoreFields
        slotKey={slotKey}
        mode={mode === 'create' ? 'create' : 'edit'}
        catalog={catalog}
        allowBreedCreate={allowBreedCreate}
        allowColorCreate={allowColorCreate}
        disabled={disabled}
        required={false}
        defaults={{
          breed: defaults?.breed,
          colorMarking: defaults?.color_marking,
          notes: defaults?.notes,
        }}
      />
      {mode === 'edit' ? (
        <>
          <RoosterProfileFields
            fieldSuffix={fieldPrefixForPolicy}
            disabled={disabled}
            hideBreed
            defaults={{
              ageClass: defaults?.age_class ?? undefined,
              competitionClass: defaults?.competition_class ?? undefined,
              hatchDate: defaults?.hatch_date ?? undefined,
              hatchDateIsEstimated: defaults?.hatch_date_is_estimated ?? undefined,
              bloodline: defaults?.bloodline ?? undefined,
              experienceStatus: defaults?.experience_status ?? undefined,
              originType: defaults?.origin_type ?? undefined,
              countryOfOrigin: defaults?.country_of_origin ?? undefined,
              provinceOfOrigin: defaults?.province_of_origin ?? undefined,
              municipalityOfOrigin: defaults?.municipality_of_origin ?? undefined,
              breedingRelationship: defaults?.breeding_relationship ?? undefined,
              breederNameExternal: defaults?.breeder_name_external ?? undefined,
              originNotes: defaults?.origin_notes ?? undefined,
            }}
          />
          <RoosterPolicyFields
            eligibilityContext={eligibilityContext}
            fieldPrefix={fieldPrefixForPolicy}
            disabled={disabled}
            defaults={{
              bandLevel: defaults?.band_level ?? undefined,
              bandOrganization: defaults?.band_organization ?? undefined,
              bandYear: defaults?.band_year,
              bandSeason: defaults?.band_season ?? undefined,
            }}
          />
        </>
      ) : null}
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
  catalog,
  publicReferenceOptions = null,
  requireAllSlots = false,
  eligibilityContext = null,
  existingRoosters = [],
}: RoosterEntrySlotsProps) {
  const slotCount = eventType === 'classic' ? 1 : cocksPerEntry
  const bandNumberRequired = isBandNumberRequiredForEvent(eventType, eligibilityContext)
  const allowBreedCreate = publicReferenceOptions?.allowBreedAdd ?? false
  const allowColorCreate = publicReferenceOptions?.allowColorAdd ?? false

  if (mode === 'create') {
    return (
      <>
        <input type="hidden" name="roosterSlotCount" value={slotCount} />
        {Array.from({ length: slotCount }, (_, index) => {
          const cockNumber = index + 1
          const isClassic = eventType === 'classic'
          const slotRequired = isClassic || requireAllSlots
          return (
            <RoosterSlotFields
              key={cockNumber}
              mode="create"
              prefix={fieldPrefixForCreate(cockNumber)}
              slotKey={String(cockNumber)}
              cockNumber={cockNumber}
              title={isClassic ? 'Rooster & weight' : `Cock #${cockNumber}`}
              required={slotRequired}
              eligibilityContext={eligibilityContext}
              fieldPrefixForPolicy={`rooster_${cockNumber}`}
              bandNumberRequired={bandNumberRequired}
              catalog={catalog}
              allowBreedCreate={allowBreedCreate}
              allowColorCreate={allowColorCreate}
            />
          )
        })}
        {eventType === 'derby' ? (
          <Text fontSize="sm" color="fg.muted">
            {requireAllSlots
              ? `Fill all ${cocksPerEntry} cock slots to submit. Breed, color, and notes are optional.`
              : 'Fill at least one cock to save. Complete bloodline and eligibility details from Edit entry.'}
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
          mode="edit"
          prefix=""
          slotKey={rooster.rooster_id}
          cockNumber={rooster.cock_number}
          title={`Cock #${rooster.cock_number}`}
          required
          disabled={rooster.is_paired}
          eligibilityContext={eligibilityContext}
          defaults={rooster}
          fieldPrefixForPolicy={fieldPrefixForExistingEdit(rooster.rooster_id)}
          namePrefix={rooster.rooster_id}
          bandNumberRequired={bandNumberRequired}
          catalog={catalog}
        />
      ))}
      {missingSlots.map((cockNumber) => (
        <RoosterSlotFields
          key={`new-${cockNumber}`}
          mode="edit"
          prefix={fieldPrefixForNewEdit(cockNumber)}
          slotKey={`new_rooster_${cockNumber}`}
          cockNumber={cockNumber}
          title={`New cock #${cockNumber}`}
          eligibilityContext={eligibilityContext}
          fieldPrefixForPolicy={`new_rooster_${cockNumber}`}
          bandNumberRequired={bandNumberRequired}
          catalog={catalog}
        />
      ))}
    </>
  )
}

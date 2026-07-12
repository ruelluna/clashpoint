'use client'

import {
  Checkbox,
  Flex,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'

import { FormField, LAYOUT_GAP } from '@/components/dashboard'
import { ReferenceValueCombobox } from '@/features/reference-values/components/reference-value-combobox'
import {
  AGE_CLASS_LABELS,
  COMPETITION_CLASS_LABELS,
  EXPERIENCE_STATUS_LABELS,
} from '@/lib/derby/enums'
import type { AgeClass, CompetitionClass, ExperienceStatus } from '@/lib/derby/enums'

const ageClasses = Object.entries(AGE_CLASS_LABELS) as Array<[AgeClass, string]>
const competitionClasses = Object.entries(COMPETITION_CLASS_LABELS) as Array<
  [CompetitionClass, string]
>
const experienceStatuses = Object.entries(EXPERIENCE_STATUS_LABELS) as Array<
  [ExperienceStatus, string]
>

const originTypes = [
  { value: 'locally_bred', label: 'Locally bred' },
  { value: 'imported', label: 'Imported' },
  { value: 'unknown', label: 'Unknown' },
] as const

const breedingRelationships = [
  { value: 'owner_bred', label: 'Owner bred' },
  { value: 'member_bred', label: 'Member bred' },
  { value: 'breeder_produced', label: 'Breeder produced' },
  { value: 'farm_owned', label: 'Farm owned' },
  { value: 'externally_acquired', label: 'Externally acquired' },
  { value: 'unknown', label: 'Unknown' },
] as const

export type RoosterProfileDefaults = {
  ageClass?: string
  competitionClass?: string
  hatchDate?: string | null
  hatchDateIsEstimated?: boolean
  breed?: string | null
  bloodline?: string | null
  experienceStatus?: string | null
  originType?: string | null
  countryOfOrigin?: string | null
  provinceOfOrigin?: string | null
  municipalityOfOrigin?: string | null
  breedingRelationship?: string | null
  breederNameExternal?: string | null
  originNotes?: string | null
}

type RoosterProfileFieldsProps = {
  fieldSuffix: string
  disabled?: boolean
  defaults?: RoosterProfileDefaults
}

function fieldName(suffix: string, name: string) {
  return `${name}_${suffix}`
}

export function RoosterProfileFields({
  fieldSuffix,
  disabled = false,
  defaults,
}: RoosterProfileFieldsProps) {
  return (
    <Stack gap={LAYOUT_GAP.form} pt={2}>
      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
      >
        Registry profile
      </Text>

      <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
        <FormField label="Age class" flex="1">
          <NativeSelect.Root disabled={disabled}>
            <NativeSelect.Field
              name={fieldName(fieldSuffix, 'ageClass')}
              defaultValue={defaults?.ageClass ?? 'unknown'}
            >
              {ageClasses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </FormField>
        <FormField label="Competition class" flex="1">
          <NativeSelect.Root disabled={disabled}>
            <NativeSelect.Field
              name={fieldName(fieldSuffix, 'competitionClass')}
              defaultValue={defaults?.competitionClass ?? 'unclassified'}
            >
              {competitionClasses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </FormField>
      </Flex>

      <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
        <FormField label="Hatch date" flex="1">
          <Input
            name={fieldName(fieldSuffix, 'hatchDate')}
            type="date"
            defaultValue={defaults?.hatchDate ?? ''}
            disabled={disabled}
          />
        </FormField>
        <FormField label="Estimated hatch date" flex="1">
          <Checkbox.Root
            name={fieldName(fieldSuffix, 'hatchDateIsEstimated')}
            defaultChecked={defaults?.hatchDateIsEstimated ?? false}
            disabled={disabled}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Date is estimated</Checkbox.Label>
          </Checkbox.Root>
        </FormField>
      </Flex>

      <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
        <ReferenceValueCombobox
          kind="breed"
          name={fieldName(fieldSuffix, 'breed')}
          label="Breed"
          defaultValue={defaults?.breed ?? ''}
          maxLength={100}
          disabled={disabled}
          flex="1"
        />
        <ReferenceValueCombobox
          kind="bloodline"
          name={fieldName(fieldSuffix, 'bloodline')}
          label="Bloodline"
          defaultValue={defaults?.bloodline ?? ''}
          maxLength={200}
          disabled={disabled}
          flex="1"
        />
      </Flex>

      <FormField label="Declared external experience">
        <NativeSelect.Root disabled={disabled}>
          <NativeSelect.Field
            name={fieldName(fieldSuffix, 'experienceStatus')}
            defaultValue={defaults?.experienceStatus ?? ''}
          >
            <option value="">None</option>
            {experienceStatuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </FormField>

      <Text
        fontSize="sm"
        fontWeight="semibold"
        color="fg.muted"
        textTransform="uppercase"
        pt={2}
      >
        Origin
      </Text>

      <FormField label="Origin type">
        <NativeSelect.Root disabled={disabled}>
          <NativeSelect.Field
            name={fieldName(fieldSuffix, 'originType')}
            defaultValue={defaults?.originType ?? 'unknown'}
          >
            {originTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </FormField>

      <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
        <FormField label="Country" flex="1">
          <Input
            name={fieldName(fieldSuffix, 'countryOfOrigin')}
            maxLength={100}
            defaultValue={defaults?.countryOfOrigin ?? ''}
            disabled={disabled}
          />
        </FormField>
        <FormField label="Province" flex="1">
          <Input
            name={fieldName(fieldSuffix, 'provinceOfOrigin')}
            maxLength={100}
            defaultValue={defaults?.provinceOfOrigin ?? ''}
            disabled={disabled}
          />
        </FormField>
      </Flex>

      <FormField label="Municipality">
        <Input
          name={fieldName(fieldSuffix, 'municipalityOfOrigin')}
          maxLength={100}
          defaultValue={defaults?.municipalityOfOrigin ?? ''}
          disabled={disabled}
        />
      </FormField>

      <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
        <FormField label="Breeding relationship" flex="1">
          <NativeSelect.Root disabled={disabled}>
            <NativeSelect.Field
              name={fieldName(fieldSuffix, 'breedingRelationship')}
              defaultValue={defaults?.breedingRelationship ?? 'unknown'}
            >
              {breedingRelationships.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </FormField>
        <FormField label="External breeder name" flex="1">
          <Input
            name={fieldName(fieldSuffix, 'breederNameExternal')}
            maxLength={200}
            defaultValue={defaults?.breederNameExternal ?? ''}
            disabled={disabled}
          />
        </FormField>
      </Flex>

      <FormField label="Origin notes">
        <Textarea
          name={fieldName(fieldSuffix, 'originNotes')}
          rows={3}
          maxLength={2000}
          defaultValue={defaults?.originNotes ?? ''}
          disabled={disabled}
        />
      </FormField>
    </Stack>
  )
}

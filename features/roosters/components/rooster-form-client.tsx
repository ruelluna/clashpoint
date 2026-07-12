'use client'

import {
  Button,
  Checkbox,
  Flex,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState } from 'react'

import {
  ButtonGroup,
  FormField,
  LAYOUT_GAP,
  PageHeader,
  PageStack,
} from '@/components/dashboard'
import {
  createRoosterAction,
  updateRoosterAction,
  type RoosterActionState,
} from '@/features/roosters/actions'
import type { RoosterRow } from '@/features/roosters/types'
import { ReferenceValueCombobox } from '@/features/reference-values/components/reference-value-combobox'
import {
  AGE_CLASS_LABELS,
  COMPETITION_CLASS_LABELS,
  EXPERIENCE_STATUS_LABELS,
} from '@/lib/derby/enums'
import type { AgeClass, CompetitionClass, ExperienceStatus } from '@/lib/derby/enums'

const initialState: RoosterActionState = {}

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

type RoosterFormClientProps =
  | { mode: 'create' }
  | { mode: 'edit'; rooster: RoosterRow }

export function RoosterFormClient(props: RoosterFormClientProps) {
  const isCreate = props.mode === 'create'
  const rooster = props.mode === 'edit' ? props.rooster : null

  const [createState, createAction, createPending] = useActionState(
    createRoosterAction,
    initialState
  )
  const [updateState, updateAction, updatePending] = useActionState(
    updateRoosterAction,
    initialState
  )

  const formState = isCreate ? createState : updateState
  const formAction = isCreate ? createAction : updateAction
  const pending = isCreate ? createPending : updatePending

  return (
    <PageStack maxW="2xl">
      <PageHeader
        title={isCreate ? 'New rooster' : `Edit ${rooster?.rooster_code ?? 'rooster'}`}
        description={
          isCreate
            ? 'Add a permanent registry rooster for reuse across events.'
            : 'Update registry profile, origin, and classification details.'
        }
      />

      <form action={formAction}>
        <Stack gap={LAYOUT_GAP.form}>
          {!isCreate && rooster ? (
            <input type="hidden" name="roosterId" value={rooster.id} />
          ) : null}

          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
          >
            Identity
          </Text>

          <FormField label="Name">
            <Input
              name="name"
              maxLength={200}
              defaultValue={rooster?.name ?? ''}
            />
          </FormField>

          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <FormField label="Age class" flex="1">
              <NativeSelect.Root>
                <NativeSelect.Field
                  name="ageClass"
                  defaultValue={rooster?.age_class ?? 'unknown'}
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
              <NativeSelect.Root>
                <NativeSelect.Field
                  name="competitionClass"
                  defaultValue={rooster?.competition_class ?? 'unclassified'}
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
                name="hatchDate"
                type="date"
                defaultValue={rooster?.hatch_date ?? ''}
              />
            </FormField>
            <FormField label="Estimated hatch date" flex="1">
              <Checkbox.Root
                name="hatchDateIsEstimated"
                defaultChecked={rooster?.hatch_date_is_estimated ?? false}
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
              name="breed"
              label="Breed"
              defaultValue={rooster?.breed ?? ''}
              maxLength={100}
              flex="1"
            />
            <ReferenceValueCombobox
              kind="bloodline"
              name="bloodline"
              label="Bloodline"
              defaultValue={rooster?.bloodline ?? ''}
              maxLength={200}
              flex="1"
            />
          </Flex>

          <FormField label="Declared external experience">
            <NativeSelect.Root>
              <NativeSelect.Field
                name="declaredExternalExperienceStatus"
                defaultValue={rooster?.declared_external_experience_status ?? ''}
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
            <NativeSelect.Root>
              <NativeSelect.Field
                name="originType"
                defaultValue={rooster?.origin_type ?? 'unknown'}
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
                name="countryOfOrigin"
                maxLength={100}
                defaultValue={rooster?.country_of_origin ?? ''}
              />
            </FormField>
            <FormField label="Province" flex="1">
              <Input
                name="provinceOfOrigin"
                maxLength={100}
                defaultValue={rooster?.province_of_origin ?? ''}
              />
            </FormField>
          </Flex>

          <FormField label="Municipality">
            <Input
              name="municipalityOfOrigin"
              maxLength={100}
              defaultValue={rooster?.municipality_of_origin ?? ''}
            />
          </FormField>

          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <FormField label="Breeding relationship" flex="1">
              <NativeSelect.Root>
                <NativeSelect.Field
                  name="breedingRelationship"
                  defaultValue={rooster?.breeding_relationship ?? 'unknown'}
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
                name="breederNameExternal"
                maxLength={200}
                defaultValue={rooster?.breeder_name_external ?? ''}
              />
            </FormField>
          </Flex>

          <FormField label="Origin notes">
            <Textarea
              name="originNotes"
              rows={3}
              maxLength={2000}
              defaultValue={rooster?.origin_notes ?? ''}
            />
          </FormField>

          {formState.error ? (
            <Text fontSize="sm" color="red.500">
              {formState.error}
            </Text>
          ) : null}
          {formState.success ? (
            <Text fontSize="sm" color="green.600">
              {formState.success}
            </Text>
          ) : null}

          <ButtonGroup mt={LAYOUT_GAP.form}>
            <Button type="submit" loading={pending}>
              {isCreate ? 'Create rooster' : 'Save changes'}
            </Button>
            <Button asChild variant="outline">
              <Link href={isCreate ? '/dashboard/roosters' : `/dashboard/roosters/${rooster?.id}`}>
                Cancel
              </Link>
            </Button>
          </ButtonGroup>
        </Stack>
      </form>
    </PageStack>
  )
}

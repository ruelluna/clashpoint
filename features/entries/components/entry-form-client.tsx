'use client'

import {
  Button,
  Flex,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState, useState } from 'react'

import {
  ButtonGroup,
  FormField,
  LAYOUT_GAP,
  PageHeader,
  PageStack,
} from '@/components/dashboard'
import {
  createEntryAction,
  type EntryActionState,
} from '@/features/entries/actions'
import {
  OwnerPickerField,
  type OwnerProfileValues,
} from '@/features/entries/components/owner-picker-field'
import {
  RoosterPolicyFields,
} from '@/features/entries/components/rooster-policy-fields'
import { ENTRY_SOURCE_LABELS } from '@/features/entries/schema'
import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'
import type { PromoterListItem } from '@/features/promoters/types'

type EntryFormClientProps = {
  eventId: string
  eventName: string
  promoters: PromoterListItem[]
  cocksPerEntry: number
  minWeight: number | null
  maxWeight: number | null
  eligibilityContext?: EntryFormEligibilityContext | null
}

const initialState: EntryActionState = {}

function formatWeightRange(minWeight: number | null, maxWeight: number | null) {
  if (minWeight == null && maxWeight == null) return 'No weight limits configured'
  return `${minWeight ?? '—'} – ${maxWeight ?? '—'} kg`
}

export function EntryFormClient({
  eventId,
  eventName,
  promoters,
  cocksPerEntry,
  minWeight,
  maxWeight,
  eligibilityContext = null,
}: EntryFormClientProps) {
  const [formState, formAction, pending] = useActionState(
    createEntryAction,
    initialState
  )
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfileValues>({
    contactNumber: '',
    email: '',
    address: '',
  })

  const activePromoters = promoters.filter((promoter) => promoter.status === 'active')

  return (
    <PageStack maxW="2xl">
      <PageHeader
        title="New rooster entry"
        description={`${eventName} · Register owner and first cock (${cocksPerEntry} per entry max). Weight limits: ${formatWeightRange(minWeight, maxWeight)}`}
      />

      <form action={formAction}>
        <Stack gap={LAYOUT_GAP.form}>
          <input type="hidden" name="eventId" value={eventId} />

          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
          >
            Owner / handler
          </Text>

          <FormField label="Entry name" required>
            <Input name="entryName" required maxLength={200} />
          </FormField>

          <OwnerPickerField onOwnerProfileChange={setOwnerProfile} />

          <FormField label="Handler name">
            <Input name="handlerName" maxLength={200} />
          </FormField>

          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <FormField label="Contact number" flex="1">
              <Input
                name="contactNumber"
                maxLength={50}
                value={ownerProfile.contactNumber}
                onChange={(event) =>
                  setOwnerProfile((current) => ({
                    ...current,
                    contactNumber: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label="Email" flex="1">
              <Input
                name="email"
                type="email"
                maxLength={200}
                value={ownerProfile.email}
                onChange={(event) =>
                  setOwnerProfile((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </FormField>
          </Flex>

          <FormField label="Address">
            <Textarea
              name="address"
              rows={2}
              maxLength={500}
              value={ownerProfile.address}
              onChange={(event) =>
                setOwnerProfile((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
            />
          </FormField>

          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <FormField label="Entry source" flex="1">
              <NativeSelect.Root>
                <NativeSelect.Field name="entrySource" defaultValue="staff_encoded">
                  {Object.entries(ENTRY_SOURCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </FormField>
            <FormField label="Referred by promoter" flex="1">
              <NativeSelect.Root>
                <NativeSelect.Field name="referredByPromoterId" defaultValue="">
                  <option value="">None</option>
                  {activePromoters.map((promoter) => (
                    <option key={promoter.id} value={promoter.id}>
                      {promoter.name}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </FormField>
          </Flex>

          <FormField label="Notes">
            <Textarea name="notes" rows={3} maxLength={2000} />
          </FormField>

          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="fg.muted"
            textTransform="uppercase"
            pt={2}
          >
            Rooster &amp; weight
          </Text>

          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <FormField label="Band number" required flex="1">
              <Input name="bandNumber" required maxLength={50} />
            </FormField>
            <FormField label="Weight (kg)" required flex="1">
              <Input name="weight" type="number" step="0.01" min="0" required />
            </FormField>
          </Flex>

          <RoosterPolicyFields eligibilityContext={eligibilityContext} />

          {formState.error ? (
            <Text fontSize="sm" color="red.500" whiteSpace="pre-line">
              {formState.error}
            </Text>
          ) : null}

          <ButtonGroup mt={LAYOUT_GAP.form}>
            <Button type="submit" loading={pending}>
              Save entry
            </Button>
            <Button asChild variant="outline">
              <Link href={`/dashboard/events/${eventId}/rooster-entries`}>Cancel</Link>
            </Button>
          </ButtonGroup>
        </Stack>
      </form>
    </PageStack>
  )
}

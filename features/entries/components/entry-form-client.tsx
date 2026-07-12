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
import { ContactNumberField } from '@/features/entries/components/contact-number-field'
import {
  OwnerPickerField,
  type OwnerProfileValues,
} from '@/features/entries/components/owner-picker-field'
import { RoosterEntrySlots } from '@/features/entries/components/rooster-entry-slots'
import { ENTRY_SOURCE_LABELS } from '@/features/entries/schema'
import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'
import type { PromoterListItem } from '@/features/promoters/types'

type EntryFormClientProps = {
  eventId: string
  eventName: string
  eventType: 'classic' | 'derby'
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

function formatDescription(
  eventName: string,
  eventType: 'classic' | 'derby',
  cocksPerEntry: number,
  minWeight: number | null,
  maxWeight: number | null
) {
  const weightText = formatWeightRange(minWeight, maxWeight)
  if (eventType === 'classic') {
    return `${eventName} · Register game farm / handler and one rooster. Weight limits: ${weightText}`
  }
  return `${eventName} · Register game farm / handler, then add up to ${cocksPerEntry} cocks (at least one required). Weight limits: ${weightText}`
}

export function EntryFormClient({
  eventId,
  eventName,
  eventType,
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
        description={formatDescription(
          eventName,
          eventType,
          cocksPerEntry,
          minWeight,
          maxWeight
        )}
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

          <OwnerPickerField onOwnerProfileChange={setOwnerProfile} />

          <FormField label="Handler name">
            <Input name="handlerName" maxLength={200} />
          </FormField>

          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <ContactNumberField
              flex="1"
              value={ownerProfile.contactNumber}
              onChange={(contactNumber) =>
                setOwnerProfile((current) => ({ ...current, contactNumber }))
              }
            />
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
            Roosters
          </Text>

          <RoosterEntrySlots
            mode="create"
            eventType={eventType}
            cocksPerEntry={cocksPerEntry}
            eligibilityContext={eligibilityContext}
          />

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

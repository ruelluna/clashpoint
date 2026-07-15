'use client'

import {
  Button,
  Flex,
  Input,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState, useState } from 'react'

import { OwnerContactFields } from '@/features/entries/components/owner-contact-fields'
import { RoosterEntrySlots } from '@/features/entries/components/rooster-entry-slots'
import {
  createPublicEntryAction,
  type PublicEntryActionState,
} from '@/features/public/actions'
import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'
import type {
  PublicReferenceOptions,
  RoosterEntryCatalog,
} from '@/features/reference-values/catalog'

type PublicEntryFormClientProps = {
  eventId: string
  eventName: string
  cocksPerEntry: number
  minWeightGrams: number | null
  maxWeightGrams: number | null
  catalog: RoosterEntryCatalog
  publicReferenceOptions: PublicReferenceOptions
  eligibilityContext?: EntryFormEligibilityContext | null
}

const initialState: PublicEntryActionState = {}

function formatWeightRange(minWeightGrams: number | null, maxWeightGrams: number | null) {
  if (minWeightGrams == null && maxWeightGrams == null) return 'No weight limits configured'
  return `${minWeightGrams ?? '—'} – ${maxWeightGrams ?? '—'} g`
}

export function PublicEntryFormClient({
  eventId,
  eventName,
  cocksPerEntry,
  minWeightGrams,
  maxWeightGrams,
  catalog,
  publicReferenceOptions,
  eligibilityContext = null,
}: PublicEntryFormClientProps) {
  const [formState, formAction, pending] = useActionState(
    createPublicEntryAction,
    initialState
  )
  const [contact, setContact] = useState({
    contactFullName: '',
    contactDesignation: '',
    contactNumber: '',
    email: '',
  })

  if (formState.success) {
    return (
      <Stack
        gap={4}
        borderWidth="1px"
        borderColor="border"
        rounded="lg"
        p={6}
        maxW="2xl"
      >
        <Text fontSize="lg" fontWeight="semibold">
          Registration submitted
        </Text>
        <Text color="fg.muted">{formState.success}</Text>
        {formState.entryNumber ? (
          <Text fontSize="sm">
            Reference: <strong>Entry #{formState.entryNumber}</strong>
          </Text>
        ) : null}
        <Text fontSize="sm" color="fg.muted">
          Keep your band numbers and contact details handy. Organizers may reach out to
          confirm your entry.
        </Text>
        <Button asChild variant="outline" alignSelf="flex-start">
          <Link href={`/events/${eventId}`}>Back to event</Link>
        </Button>
      </Stack>
    )
  }

  return (
    <Stack gap={6} maxW="2xl">
      <Stack gap={1}>
        <Text fontSize="xl" fontWeight="semibold">
          Register for {eventName}
        </Text>
        <Text color="fg.muted" fontSize="sm">
          Add up to {cocksPerEntry} cock(s) per entry (at least one required). Weight limits:{' '}
          {formatWeightRange(minWeightGrams, maxWeightGrams)}
        </Text>
      </Stack>

      <form action={formAction}>
        <Stack gap={4}>
          <input type="hidden" name="eventId" value={eventId} />

          {formState.error ? (
            <Text color="red.fg" fontSize="sm" role="alert">
              {formState.error}
            </Text>
          ) : null}

          <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
            Owner
          </Text>

          <Stack gap={1}>
            <Text fontSize="sm" fontWeight="medium">
              Owner / game farm name
            </Text>
            <Input name="ownerName" maxLength={200} required />
          </Stack>

          <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
            Contact information
          </Text>

          <OwnerContactFields values={contact} onChange={setContact} />

          <Stack gap={1}>
            <Text fontSize="sm" fontWeight="medium">
              Notes
            </Text>
            <Textarea name="notes" rows={3} maxLength={2000} />
          </Stack>

          <Text fontSize="sm" fontWeight="semibold" color="fg.muted" textTransform="uppercase">
            Roosters
          </Text>

          <RoosterEntrySlots
            mode="create"
            eventType="derby"
            cocksPerEntry={cocksPerEntry}
            catalog={catalog}
            publicReferenceOptions={publicReferenceOptions}
            eligibilityContext={eligibilityContext}
          />

          <Flex gap={3} pt={2}>
            <Button type="submit" loading={pending}>
              Submit registration
            </Button>
            <Button asChild variant="outline">
              <Link href={`/events/${eventId}`}>Cancel</Link>
            </Button>
          </Flex>
        </Stack>
      </form>
    </Stack>
  )
}

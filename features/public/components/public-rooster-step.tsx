'use client'

import { Button, Flex, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'

import { RoosterEntrySlots } from '@/features/entries/components/rooster-entry-slots'
import {
  registerPublicRoostersAction,
  type PublicRegistrationActionState,
} from '@/features/public/actions'
import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'

type PublicRoosterStepProps = {
  eventId: string
  eventName: string
  eventType: 'classic' | 'derby'
  cocksPerEntry: number
  entryNumber?: string
  roosterCount: number
  eligibilityContext?: EntryFormEligibilityContext | null
  onComplete: (state: PublicRegistrationActionState) => void
}

const initialState: PublicRegistrationActionState = {}

function formatWeightRange(minWeightGrams: number | null, maxWeightGrams: number | null) {
  if (minWeightGrams == null && maxWeightGrams == null) return 'No weight limits configured'
  return `${minWeightGrams ?? '—'} – ${maxWeightGrams ?? '—'} g`
}

export function PublicRoosterStep({
  eventId,
  eventName,
  eventType,
  cocksPerEntry,
  entryNumber,
  roosterCount,
  eligibilityContext = null,
  onComplete,
}: PublicRoosterStepProps) {
  const [formState, formAction, pending] = useActionState(
    registerPublicRoostersAction,
    initialState
  )

  useEffect(() => {
    if (formState.step === 'complete' && formState.success) {
      onComplete(formState)
    }
  }, [formState, onComplete])

  const remainingSlots =
    eventType === 'classic'
      ? Math.max(0, 1 - roosterCount)
      : Math.max(0, cocksPerEntry - roosterCount)

  if (remainingSlots === 0) {
    return (
      <Stack gap={4} maxW="2xl" borderWidth="1px" borderColor="border" rounded="lg" p={6}>
        <Text fontSize="lg" fontWeight="semibold">
          Registration complete
        </Text>
        <Text color="fg.muted">
          {entryNumber
            ? `Entry #${entryNumber} already has the maximum rooster(s) for this event.`
            : 'This entry already has the maximum rooster(s) for this event.'}
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
          Step 2 — Rooster registration
        </Text>
        <Text color="fg.muted" fontSize="sm">
          {entryNumber ? `Entry #${entryNumber} · ` : ''}
          {eventName}
        </Text>
        <Text color="fg.muted" fontSize="sm">
          Add up to {remainingSlots} rooster(s). At least one is required.
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

          <RoosterEntrySlots
            mode="create"
            eventType={eventType}
            cocksPerEntry={cocksPerEntry}
            slotCount={remainingSlots}
            eligibilityContext={eligibilityContext}
          />

          <Flex gap={3} pt={2}>
            <Button type="submit" loading={pending}>
              Submit rooster registration
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

export { formatWeightRange }

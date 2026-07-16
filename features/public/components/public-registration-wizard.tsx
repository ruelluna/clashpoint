'use client'

import { Button, Flex, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useCallback, useState } from 'react'

import type { EntryFormEligibilityContext } from '@/features/eligibility/entry-form-context'
import type { PublicRegistrationActionState } from '@/features/public/actions'
import { PublicGameFarmStep } from '@/features/public/components/public-game-farm-step'
import { PublicRoosterStep } from '@/features/public/components/public-rooster-step'
import type {
  PublicReferenceOptions,
  RoosterEntryCatalog,
} from '@/features/reference-values/catalog'

function formatWeightRange(minWeightGrams: number | null, maxWeightGrams: number | null) {
  if (minWeightGrams == null && maxWeightGrams == null) return 'No weight limits configured'
  return `${minWeightGrams ?? '—'} – ${maxWeightGrams ?? '—'} g`
}

export type PublicRegistrationSessionContext = {
  entryId?: string
  entryNumber?: string
  competitorId?: string
  roosterCount?: number
  cocksPerEntry?: number
  eventType?: 'classic' | 'derby'
  error?: string
}

type PublicRegistrationWizardProps = {
  eventId: string
  eventName: string
  eventType: 'classic' | 'derby'
  cocksPerEntry: number
  minWeightGrams: number | null
  maxWeightGrams: number | null
  catalog: RoosterEntryCatalog
  publicReferenceOptions: PublicReferenceOptions
  eligibilityContext?: EntryFormEligibilityContext | null
  sessionContext?: PublicRegistrationSessionContext | null
}

type WizardStep = 'farm' | 'roosters' | 'complete'

function resolveInitialStep(
  sessionContext?: PublicRegistrationSessionContext | null
): WizardStep {
  if (sessionContext?.error) return 'farm'
  if (sessionContext?.entryId) return 'roosters'
  return 'farm'
}

export function PublicRegistrationWizard({
  eventId,
  eventName,
  eventType,
  cocksPerEntry,
  minWeightGrams,
  maxWeightGrams,
  catalog,
  publicReferenceOptions,
  eligibilityContext = null,
  sessionContext = null,
}: PublicRegistrationWizardProps) {
  const [step, setStep] = useState<WizardStep>(() => resolveInitialStep(sessionContext))
  const [entryNumber, setEntryNumber] = useState(sessionContext?.entryNumber ?? '')
  const [roosterCount, setRoosterCount] = useState(sessionContext?.roosterCount ?? 0)
  const [completeState, setCompleteState] = useState<PublicRegistrationActionState | null>(
    null
  )

  const handleFarmComplete = useCallback((state: PublicRegistrationActionState) => {
    if (state.entryNumber) setEntryNumber(state.entryNumber)
    setStep('roosters')
  }, [])

  const handleRoosterComplete = useCallback((state: PublicRegistrationActionState) => {
    setCompleteState(state)
    setEntryNumber(state.entryNumber ?? entryNumber)
    setStep('complete')
  }, [entryNumber])

  if (step === 'complete' && completeState?.success) {
    return (
      <Stack gap={4} borderWidth="1px" borderColor="border" rounded="lg" p={6} maxW="2xl">
        <Text fontSize="lg" fontWeight="semibold">
          Registration submitted
        </Text>
        <Text color="fg.muted">{completeState.success}</Text>
        {completeState.entryNumber ? (
          <Text fontSize="sm">
            Reference: <strong>Entry #{completeState.entryNumber}</strong>
          </Text>
        ) : null}
        {completeState.bandNumbers && completeState.bandNumbers.length > 0 ? (
          <Text fontSize="sm">
            Band number(s): {completeState.bandNumbers.join(', ')}
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
          Online registration is a two-step process: game farm details, then rooster
          registration. Weight limits: {formatWeightRange(minWeightGrams, maxWeightGrams)}
        </Text>
      </Stack>

      <Flex gap={2} fontSize="sm">
        <Text fontWeight={step === 'farm' ? 'semibold' : 'normal'} color={step === 'farm' ? 'fg' : 'fg.muted'}>
          1. Game farm
        </Text>
        <Text color="fg.muted">→</Text>
        <Text
          fontWeight={step === 'roosters' ? 'semibold' : 'normal'}
          color={step === 'roosters' ? 'fg' : 'fg.muted'}
        >
          2. Roosters
        </Text>
      </Flex>

      {sessionContext?.error ? (
        <Text color="red.fg" fontSize="sm">
          {sessionContext.error}
        </Text>
      ) : null}

      {step === 'farm' ? (
        <PublicGameFarmStep eventId={eventId} onComplete={handleFarmComplete} />
      ) : (
        <PublicRoosterStep
          eventId={eventId}
          eventName={eventName}
          eventType={eventType}
          cocksPerEntry={cocksPerEntry}
          catalog={catalog}
          publicReferenceOptions={publicReferenceOptions}
          entryNumber={entryNumber || sessionContext?.entryNumber}
          roosterCount={roosterCount}
          eligibilityContext={eligibilityContext}
          onComplete={handleRoosterComplete}
        />
      )}
    </Stack>
  )
}

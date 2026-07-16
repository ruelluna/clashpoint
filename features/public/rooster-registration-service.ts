import 'server-only'

import { addEntryRoosters } from '@/features/entries/service'
import type { NewEntryRosterItemInput } from '@/features/entries/schema'
import {
  getEntryFormEligibilityContext,
  toPolicyValidationContext,
} from '@/features/eligibility/registration-bridge'
import { isEligibilityFieldEnabled } from '@/lib/derby/eligibility-fields'
import type { EligibilityFieldKey } from '@/lib/derby/eligibility-fields'
import { validateRoosterAgainstPolicy } from '@/features/entries/policy-validation'
import type { CreatePublicRoostersInput } from '@/features/public/schema'
import { getPublicRegistrationEvent } from '@/features/public/queries'
import { getPublicRegistrationEntryContext } from '@/features/public/owner-registration-service'
import {
  clearPublicRegistrationSession,
  getPublicRegistrationSession,
} from '@/features/public/session-cookie'
import { getPublicReferenceOptions } from '@/features/reference-values/catalog'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_WRITE = { useAdminClient: true } as const

function validateCreateWeightOnly(
  roosters: Array<{ weight: number }>,
  eligibilityContext: Awaited<ReturnType<typeof getEntryFormEligibilityContext>>
): string | null {
  if (!eligibilityContext) return null
  if (!isEligibilityFieldEnabled(eligibilityContext.enabledFields, 'weight')) {
    return null
  }

  const policyContext = toPolicyValidationContext(eligibilityContext)
  const weightOnlyContext = {
    ...policyContext,
    enabledFields: ['weight'] as EligibilityFieldKey[],
  }

  for (const rooster of roosters) {
    const policyError = validateRoosterAgainstPolicy(
      { weight: rooster.weight },
      weightOnlyContext
    )
    if (policyError) return policyError
  }

  return null
}

function requiredRosterCount(
  eventType: 'classic' | 'derby',
  cocksPerEntry: number
): number {
  return eventType === 'classic' ? 1 : cocksPerEntry
}

export async function createPublicRoostersForEntry(
  input: CreatePublicRoostersInput
): Promise<{ error?: string; entryNumber?: string; bandNumbers?: string[] }> {
  const session = await getPublicRegistrationSession()
  if (!session || session.eventId !== input.eventId) {
    return { error: 'Your registration session has expired. Start again from game farm registration.' }
  }

  const event = await getPublicRegistrationEvent(input.eventId)
  if (!event) return { error: 'Event not found' }
  if (!event.registration_open) {
    return { error: 'Registration is closed for this event' }
  }

  const context = await getPublicRegistrationEntryContext(input.eventId)
  if (!context || context.error || !context.entryId) {
    return { error: context?.error ?? 'Registration session is invalid' }
  }

  const existingCount = context.roosterCount ?? 0
  if (existingCount > 0) {
    return { error: 'Rooster registration for this entry is already complete.' }
  }

  const expectedCount = requiredRosterCount(event.event_type, event.cocks_per_entry)
  if (input.roosters.length !== expectedCount) {
    return {
      error:
        event.event_type === 'classic'
          ? 'Classic events require exactly one rooster'
          : `Submit all ${event.cocks_per_entry} rooster(s) for this derby entry`,
    }
  }

  const eligibilityContext = await getEntryFormEligibilityContext(input.eventId, {
    useAdminClient: true,
  })
  const weightError = validateCreateWeightOnly(input.roosters, eligibilityContext)
  if (weightError) return { error: weightError }

  const rosterItems = input.roosters.map((rooster, index) => ({
    cockIndex: rooster.cockIndex ?? index + 1,
    entryName: rooster.entryName,
    bandNumber: rooster.bandNumber,
    weight: rooster.weight,
    handlerName: rooster.handlerName,
    breed: rooster.breed,
    colorMarking: rooster.colorMarking,
    notes: rooster.notes,
  })) as NewEntryRosterItemInput[]

  const publicReferenceOptions = await getPublicReferenceOptions()
  const result = await addEntryRoosters(
    null,
    input.eventId,
    context.entryId,
    rosterItems,
    {
      ...ADMIN_WRITE,
      catalogResolution: {
        mode: 'public',
        allowBreedAdd: publicReferenceOptions.allowBreedAdd,
        allowColorAdd: publicReferenceOptions.allowColorAdd,
      },
    }
  )

  if (result.error) return { error: result.error }

  const supabase = createAdminClient()
  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('entry_number')
    .eq('id', context.entryId)
    .maybeSingle()

  if (entryError) return { error: entryError.message }

  const { data: registrations } = await supabase
    .from('rooster_event_registrations')
    .select('band_number')
    .eq('entry_id', context.entryId)
    .order('cock_number', { ascending: true })

  await clearPublicRegistrationSession()

  return {
    entryNumber: (entry?.entry_number as string | undefined) ?? context.entryNumber,
    bandNumbers: (registrations ?? []).map((row) => row.band_number as string),
  }
}

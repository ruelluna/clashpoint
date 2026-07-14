'use server'

import { revalidatePath } from 'next/cache'

import {
  getEntryFormEligibilityContext,
  toPolicyValidationContext,
} from '@/features/eligibility/registration-bridge'
import { isEligibilityFieldEnabled } from '@/lib/derby/eligibility-fields'
import type { EligibilityFieldKey } from '@/lib/derby/eligibility-fields'
import { validateEntryRosterCount } from '@/features/entries/schema'
import { validateRoosterAgainstPolicy } from '@/features/entries/policy-validation'
import {
  createPublicEntrySchema,
  parsePublicEntryFromFormData,
} from '@/features/public/schema'
import { createPublicEntryWithRoosters } from '@/features/public/service'
import { getPublicRegistrationEvent } from '@/features/public/queries'

export type PublicEntryActionState = {
  error?: string
  success?: string
  entryNumber?: string
}

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

export async function createPublicEntryAction(
  _prev: PublicEntryActionState,
  formData: FormData
): Promise<PublicEntryActionState> {
  const parsedForm = parsePublicEntryFromFormData(formData)
  if (parsedForm.parseErrors.length > 0 || !parsedForm.metadata) {
    return { error: parsedForm.parseErrors[0] ?? 'Invalid entry details' }
  }

  const createInput = {
    ...parsedForm.metadata,
    entrySource: 'online' as const,
    roosters: parsedForm.roosters,
  }

  const schemaResult = createPublicEntrySchema.safeParse(createInput)
  if (!schemaResult.success) {
    return { error: schemaResult.error.issues[0]?.message ?? 'Invalid input' }
  }

  const event = await getPublicRegistrationEvent(schemaResult.data.eventId)
  if (!event) return { error: 'Event not found' }

  const countError = validateEntryRosterCount(
    schemaResult.data.roosters.length,
    event.event_type,
    event.cocks_per_entry
  )
  if (countError) return { error: countError }

  const eligibilityContext = await getEntryFormEligibilityContext(
    schemaResult.data.eventId,
    { useAdminClient: true }
  )
  const weightError = validateCreateWeightOnly(
    schemaResult.data.roosters,
    eligibilityContext
  )
  if (weightError) return { error: weightError }

  const result = await createPublicEntryWithRoosters(schemaResult.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/events/${schemaResult.data.eventId}/register`)
  revalidatePath(`/dashboard/events/${schemaResult.data.eventId}/roosters`)

  const entryLabel = result.entryNumber ? `Entry #${result.entryNumber}` : 'Your entry'
  const approvalNote = event.require_rooster_entry_approval
    ? ' Staff will review your registration.'
    : ''

  return {
    success: `${entryLabel} has been submitted.${approvalNote}`,
    entryNumber: result.entryNumber,
  }
}

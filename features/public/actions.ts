'use server'

import { revalidatePath } from 'next/cache'

import { searchPublicGameFarms } from '@/features/competitors/queries'
import {
  createPublicOwnerRegistration,
  getPublicRegistrationEntryContext,
  sendPublicOwnerVerification,
  verifyPublicOwnerVerification,
} from '@/features/public/owner-registration-service'
import { createPublicRoostersForEntry } from '@/features/public/rooster-registration-service'
import {
  parsePublicOwnerFromFormData,
  parsePublicRoostersFromFormData,
  searchPublicGameFarmsSchema,
  verifyOwnerVerificationSchema,
} from '@/features/public/schema'
import { getPublicRegistrationEvent } from '@/features/public/queries'

export type PublicRegistrationActionState = {
  error?: string
  success?: string
  entryNumber?: string
  entryId?: string
  maskedEmail?: string
  testCode?: string
  step?: 'roosters' | 'complete'
  bandNumbers?: string[]
}

export async function searchPublicGameFarmsAction(
  query: string
): Promise<{ error?: string; results?: Array<{ id: string; displayName: string }> }> {
  const trimmed = query.trim()
  if (trimmed.length > 0 && trimmed.length < 2) {
    return { error: 'Type at least 2 characters to search' }
  }

  const parsed = searchPublicGameFarmsSchema.safeParse({ query: trimmed })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid search' }
  }

  try {
    const results = await searchPublicGameFarms(parsed.data.query, parsed.data.limit)
    return { results }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed'
    return { error: message }
  }
}

export async function registerPublicGameFarmAction(
  _prev: PublicRegistrationActionState,
  formData: FormData
): Promise<PublicRegistrationActionState> {
  const parsed = parsePublicOwnerFromFormData(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid game farm details' }
  }

  const result = await createPublicOwnerRegistration(parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/events/${parsed.data.eventId}/register`)

  return {
    success: result.entryNumber
      ? `Game farm registered as Entry #${result.entryNumber}. Add your rooster(s) next.`
      : 'Game farm registered. Add your rooster(s) next.',
    entryNumber: result.entryNumber,
    entryId: result.entryId,
    step: 'roosters',
  }
}

export async function sendPublicOwnerVerificationAction(input: {
  eventId: string
  competitorId: string
}): Promise<PublicRegistrationActionState> {
  const parsed = verifyOwnerVerificationSchema
    .pick({ eventId: true, competitorId: true })
    .safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid request' }
  }

  const result = await sendPublicOwnerVerification(parsed.data)
  if (result.error) return { error: result.error }

  return {
    success: result.maskedEmail
      ? `Verification code sent to ${result.maskedEmail}.`
      : 'Verification code sent.',
    maskedEmail: result.maskedEmail,
    testCode: result.testCode,
  }
}

export async function verifyPublicOwnerVerificationAction(
  _prev: PublicRegistrationActionState,
  formData: FormData
): Promise<PublicRegistrationActionState> {
  const schemaResult = verifyOwnerVerificationSchema.safeParse({
    eventId: formData.get('eventId'),
    competitorId: formData.get('competitorId'),
    code: formData.get('code')?.toString().trim(),
  })

  if (!schemaResult.success) {
    return { error: schemaResult.error.issues[0]?.message ?? 'Invalid verification code' }
  }

  const result = await verifyPublicOwnerVerification(schemaResult.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/events/${schemaResult.data.eventId}/register`)

  return {
    success: result.entryNumber
      ? `Verified. Continue with Entry #${result.entryNumber}.`
      : 'Verified. Continue with rooster registration.',
    entryNumber: result.entryNumber,
    entryId: result.entryId,
    step: 'roosters',
  }
}

export async function registerPublicRoostersAction(
  _prev: PublicRegistrationActionState,
  formData: FormData
): Promise<PublicRegistrationActionState> {
  const eventId = formData.get('eventId')?.toString() ?? ''
  const event = await getPublicRegistrationEvent(eventId)
  if (!event) return { error: 'Event not found' }

  const parsed = parsePublicRoostersFromFormData(formData)
  if (parsed.parseErrors.length > 0) {
    return { error: parsed.parseErrors[0] ?? 'Invalid rooster details' }
  }
  if (!parsed.schemaResult.success) {
    return {
      error: parsed.schemaResult.error.issues[0]?.message ?? 'Invalid rooster details',
    }
  }

  const result = await createPublicRoostersForEntry(parsed.schemaResult.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/events/${eventId}/register`)
  revalidatePath(`/dashboard/events/${eventId}/rooster-entries`)

  const approvalNote = event.require_rooster_entry_approval
    ? ' Staff will review your registration.'
    : ''

  return {
    success: `${result.entryNumber ? `Entry #${result.entryNumber}` : 'Your entry'} has been submitted.${approvalNote}`,
    entryNumber: result.entryNumber,
    bandNumbers: result.bandNumbers,
    step: 'complete',
  }
}

export async function getPublicRegistrationSessionAction(eventId: string) {
  return getPublicRegistrationEntryContext(eventId)
}

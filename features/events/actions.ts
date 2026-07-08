'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import {
  createEventSchema,
  transitionStatusSchema,
  updateEventSchema,
  updatePrizeStructureSchema,
} from '@/features/events/schema'
import {
  createEvent,
  transitionStatus,
  updateEvent,
  updatePrizeStructure,
} from '@/features/events/service'
import { requirePermission } from '@/lib/auth/permissions'

export type ActionState = { error?: string; success?: string }

function parseOptionalNumber(value: FormDataEntryValue | null): number | null {
  if (value == null || value.toString().trim() === '') return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function parseOptionalUuid(value: FormDataEntryValue | null): string | null {
  if (value == null || value.toString().trim() === '') return null
  return value.toString()
}

function parseDateTime(value: FormDataEntryValue | null): string | null {
  if (value == null || value.toString().trim() === '') return null
  const date = new Date(value.toString())
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function parseCheckbox(value: FormDataEntryValue | null): boolean {
  return value === 'on' || value === 'true' || value === '1'
}

function parsePrizeStructure(formData: FormData) {
  const prizeType = formData.get('prizeType')?.toString() ?? 'percentage'
  const rawConfig = formData.get('prizeConfig')?.toString() ?? '[]'

  let config: unknown
  try {
    config = JSON.parse(rawConfig)
  } catch {
    return { error: 'Invalid prize structure configuration' as const }
  }

  return {
    prizeStructure: {
      prizeType,
      config,
    },
  }
}

function parseEventFields(formData: FormData) {
  const prize = parsePrizeStructure(formData)
  if ('error' in prize) return prize

  return {
    promoterId: parseOptionalUuid(formData.get('promoterId')),
    name: formData.get('name')?.toString() ?? '',
    venue: formData.get('venue')?.toString() ?? '',
    eventDate: parseDateTime(formData.get('eventDate')),
    registrationDeadline: parseDateTime(formData.get('registrationDeadline')),
    eventType: formData.get('eventType')?.toString() ?? 'house',
    derbyType: formData.get('derbyType')?.toString() ?? '5_cock',
    entryFee: formData.get('entryFee')?.toString() ?? '0',
    minEntries: parseOptionalNumber(formData.get('minEntries')),
    maxEntries: parseOptionalNumber(formData.get('maxEntries')),
    cocksPerEntry: formData.get('cocksPerEntry')?.toString() ?? '5',
    minWeight: parseOptionalNumber(formData.get('minWeight')),
    maxWeight: parseOptionalNumber(formData.get('maxWeight')),
    scoringSystem: formData.get('scoringSystem')?.toString() ?? 'points',
    drawRule: formData.get('drawRule')?.toString() ?? '0.5 points',
    tieBreakerRule:
      formData.get('tieBreakerRule')?.toString() ?? 'shared_championship',
    guaranteedPrizeAmount: parseOptionalNumber(formData.get('guaranteedPrizeAmount')),
    houseDeduction: parseOptionalNumber(formData.get('houseDeduction')),
    venueShare: parseOptionalNumber(formData.get('venueShare')),
    legalAuthorized: parseCheckbox(formData.get('legalAuthorized')),
    isPublic: parseCheckbox(formData.get('isPublic')),
    publishMatches: parseCheckbox(formData.get('publishMatches')),
    publishStandings: parseCheckbox(formData.get('publishStandings')),
    publishWinners: parseCheckbox(formData.get('publishWinners')),
    publishPrizeAmounts: parseCheckbox(formData.get('publishPrizeAmounts')),
    notes: formData.get('notes')?.toString().trim() || null,
    prizeStructure: prize.prizeStructure,
  }
}

export async function createEventAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requirePermission('events.manage')

  const fields = parseEventFields(formData)
  if ('error' in fields) return { error: fields.error }

  const parsed = createEventSchema.safeParse(fields)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await createEvent(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/events')
  redirect(`/dashboard/events/${result.eventId}`)
}

export async function updateEventAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requirePermission('events.manage')

  const eventId = formData.get('eventId')?.toString()
  const fields = parseEventFields(formData)
  if ('error' in fields) return { error: fields.error }

  const parsed = updateEventSchema.safeParse({
    ...fields,
    eventId,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await updateEvent(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/events')
  revalidatePath(`/dashboard/events/${parsed.data.eventId}`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/edit`)
  return { success: 'Event updated' }
}

export async function transitionStatusAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requirePermission('events.manage')

  const parsed = transitionStatusSchema.safeParse({
    eventId: formData.get('eventId'),
    status: formData.get('status'),
    reason: formData.get('reason')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await transitionStatus(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath('/dashboard/events')
  revalidatePath(`/dashboard/events/${parsed.data.eventId}`)
  return { success: 'Status updated' }
}

export async function updatePrizeStructureAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requirePermission('events.manage')

  const prize = parsePrizeStructure(formData)
  if ('error' in prize) return { error: prize.error }

  const parsed = updatePrizeStructureSchema.safeParse({
    eventId: formData.get('eventId'),
    prizeStructure: prize.prizeStructure,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await updatePrizeStructure(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidatePath(`/dashboard/events/${parsed.data.eventId}`)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/edit`)
  return { success: 'Prize structure updated' }
}

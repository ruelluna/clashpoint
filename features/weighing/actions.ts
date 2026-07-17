'use server'

import { redirect } from 'next/navigation'

import {
  parseRoosterBreedFromForm,
  parseRoosterColorFromForm,
} from '@/features/entries/rooster-color'
import {
  getEntryFormEligibilityContext,
} from '@/features/eligibility/registration-bridge'
import {
  isBandNumberRequiredForEvent,
} from '@/features/entries/schema'
import {
  buildCreateRoosterSchema,
  recordWeightSchema,
  recordInspectionWeightSchema,
  verifyWeightSchema,
} from '@/features/weighing/schema'
import {
  createRoosterForEntry,
  recordWeight,
  recordAndVerifyWeightFromGrams,
  verifyWeight,
} from '@/features/weighing/service'
import { revalidateEventRoostersPaths } from '@/features/event-roosters/revalidate'
import { getEvent } from '@/features/events/queries'
import { requireAnyPermission } from '@/lib/auth/permissions'

export type WeighingActionState = {
  error?: string
  success?: string
  weightStatus?: 'passed' | 'failed'
  weighingId?: string
}

export async function createRoosterAction(
  _prev: WeighingActionState,
  formData: FormData
): Promise<WeighingActionState> {
  const profile = await requireAnyPermission([
    'cock_entry.manage',
    'entries.manage',
    'weighing.manage',
  ])

  const eventId = formData.get('eventId')?.toString()
  if (!eventId) {
    return { error: 'Event is required' }
  }

  const eligibilityContext = await getEntryFormEligibilityContext(eventId)
  const eventType = formData.get('eventType')?.toString() ?? 'derby'
  const bandingRequired = isBandNumberRequiredForEvent(eventType, eligibilityContext)
  const createRoosterSchema = buildCreateRoosterSchema(bandingRequired)

  const parsed = createRoosterSchema.safeParse({
    eventId,
    entryId: formData.get('entryId'),
    entryName: formData.get('entryName')?.toString().trim(),
    bandNumber: formData.get('bandNumber'),
    weight: formData.get('weight'),
    handlerName: formData.get('handlerName')?.toString().trim() || undefined,
    breed: parseRoosterBreedFromForm(formData, '', 'staff'),
    colorMarking: parseRoosterColorFromForm(formData, '', 'staff'),
    notes: formData.get('notes')?.toString().trim(),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid rooster details' }
  }

  const result = await createRoosterForEntry(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateEventRoostersPaths(parsed.data.eventId)

  const event = await getEvent(parsed.data.eventId)
  if (event?.event_type === 'derby' && result.roosterId) {
    redirect(`/dashboard/events/${parsed.data.eventId}/roosters/${result.roosterId}/print`)
  }

  return { success: 'Rooster added' }
}

export async function recordWeightAction(
  _prev: WeighingActionState,
  formData: FormData
): Promise<WeighingActionState> {
  const profile = await requireAnyPermission([
    'weighing.record',
    'cock_entry.manage',
    'entries.manage',
  ])

  const parsed = recordWeightSchema.safeParse({
    eventId: formData.get('eventId'),
    roosterRecordId: formData.get('roosterRecordId'),
    officialWeight: formData.get('officialWeight'),
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid weight' }
  }

  const result = await recordWeight(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateEventRoostersPaths(parsed.data.eventId)

  return { success: 'Weight recorded' }
}

export async function verifyWeightAction(
  _prev: WeighingActionState,
  formData: FormData
): Promise<WeighingActionState> {
  const profile = await requireAnyPermission([
    'weighing.verify',
    'cock_entry.manage',
    'entries.manage',
  ])

  const parsed = verifyWeightSchema.safeParse({
    eventId: formData.get('eventId'),
    weighingId: formData.get('weighingId'),
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid verification' }
  }

  const result = await verifyWeight(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateEventRoostersPaths(parsed.data.eventId)

  return { success: 'Weight verified' }
}

export async function recordAndVerifyWeightAction(
  _prev: WeighingActionState,
  formData: FormData
): Promise<WeighingActionState> {
  const profile = await requireAnyPermission([
    'weighing.record',
    'weighing.verify',
    'inspection.record',
    'cock_entry.manage',
    'entries.manage',
  ])

  const parsed = recordInspectionWeightSchema.safeParse({
    eventId: formData.get('eventId'),
    roosterRecordId: formData.get('roosterRecordId'),
    officialWeightGrams: formData.get('officialWeightGrams'),
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid weight' }
  }

  const result = await recordAndVerifyWeightFromGrams(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateEventRoostersPaths(parsed.data.eventId)

  return {
    success: result.weightStatus === 'passed' ? 'Weight passed' : 'Weight failed',
    weightStatus: result.weightStatus,
    weighingId: result.weighingId,
  }
}

'use server'

import { revalidatePath } from 'next/cache'

import { revalidateEventRoostersPaths } from '@/features/event-roosters/revalidate'
import {
  approveInspectionSchema,
  recordInspectionSchema,
  rejectInspectionSchema,
} from '@/features/inspection/schema'
import {
  approveInspection,
  recordInspection,
  rejectInspection,
} from '@/features/inspection/service'
import { recordInspectionWeightSchema } from '@/features/weighing/schema'
import { recordAndVerifyWeightFromGrams } from '@/features/weighing/service'
import { getRegistrationIdByCockEntryBarcode } from '@/features/inspection/queries'
import {
  isCockEntryBarcodeForEvent,
  normalizeCockEntryBarcodeInput,
} from '@/features/entries/schema'
import { requireAnyPermission } from '@/lib/auth/permissions'

export type InspectionActionState = {
  error?: string
  success?: string
  weightStatus?: 'passed' | 'failed'
  inspectionClosed?: boolean
}

export type RoosterBarcodeLookupResult = { registrationId?: string; error?: string }

export async function lookupRoosterByBarcodeAction(
  eventId: string,
  rawBarcode: string
): Promise<RoosterBarcodeLookupResult> {
  await requireAnyPermission([
    'inspection.record',
    'weighing.verify',
    'weighing.record',
    'entries.manage',
  ])

  const barcode = normalizeCockEntryBarcodeInput(rawBarcode)
  if (!barcode) {
    return { error: 'Enter a barcode to scan' }
  }

  if (!isCockEntryBarcodeForEvent(barcode, eventId)) {
    return { error: 'This barcode does not belong to this event' }
  }

  const registrationId = await getRegistrationIdByCockEntryBarcode(eventId, barcode)
  if (!registrationId) {
    return { error: `No rooster found for barcode ${barcode}` }
  }

  return { registrationId }
}

export async function recordInspectionAction(
  _prev: InspectionActionState,
  formData: FormData
): Promise<InspectionActionState> {
  const profile = await requireAnyPermission(['inspection.record', 'entries.manage'])

  const parsed = recordInspectionSchema.safeParse({
    eventId: formData.get('eventId'),
    registrationId: formData.get('registrationId'),
    inspectionStatus: formData.get('inspectionStatus'),
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid inspection details' }
  }

  const result = await recordInspection(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateEventRoostersPaths(parsed.data.eventId)
  revalidatePath(`/dashboard/events/${parsed.data.eventId}/payments`)
  return { success: 'Inspection recorded', inspectionClosed: true }
}

export async function approveInspectionAction(
  _prev: InspectionActionState,
  formData: FormData
): Promise<InspectionActionState> {
  const profile = await requireAnyPermission(['inspection.approve', 'entries.manage'])

  const parsed = approveInspectionSchema.safeParse({
    eventId: formData.get('eventId'),
    inspectionId: formData.get('inspectionId'),
    notes: formData.get('notes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid approval details' }
  }

  const result = await approveInspection(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateEventRoostersPaths(parsed.data.eventId)
  revalidatePath('/dashboard/audit')
  return { success: 'Inspection approved', inspectionClosed: true }
}

export async function rejectInspectionAction(
  _prev: InspectionActionState,
  formData: FormData
): Promise<InspectionActionState> {
  const profile = await requireAnyPermission(['inspection.approve', 'entries.manage'])

  const parsed = rejectInspectionSchema.safeParse({
    eventId: formData.get('eventId'),
    inspectionId: formData.get('inspectionId'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid rejection details' }
  }

  const result = await rejectInspection(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateEventRoostersPaths(parsed.data.eventId)
  revalidatePath('/dashboard/audit')
  return { success: 'Inspection rejected', inspectionClosed: true }
}

export async function submitInspectionWeightAction(
  _prev: InspectionActionState,
  formData: FormData
): Promise<InspectionActionState> {
  const profile = await requireAnyPermission([
    'inspection.record',
    'weighing.record',
    'weighing.verify',
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

  const weightResult = await recordAndVerifyWeightFromGrams(profile.id, parsed.data)
  if (weightResult.error) return { error: weightResult.error }

  revalidateEventRoostersPaths(parsed.data.eventId)

  if (weightResult.weightStatus === 'failed') {
    const inspectionResult = await recordInspection(profile.id, {
      eventId: parsed.data.eventId,
      registrationId: parsed.data.roosterRecordId,
      inspectionStatus: 'failed',
      notes: 'Weight out of range',
    })

    if (inspectionResult.error) return { error: inspectionResult.error }

    revalidateEventRoostersPaths(parsed.data.eventId)
    revalidatePath(`/dashboard/events/${parsed.data.eventId}/payments`)

    return {
      success: 'Weight failed — inspection marked as failed',
      weightStatus: 'failed',
      inspectionClosed: true,
    }
  }

  return {
    success: 'Weight passed',
    weightStatus: 'passed',
  }
}

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
import { requireAnyPermission } from '@/lib/auth/permissions'

export type InspectionActionState = { error?: string; success?: string }

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
  return { success: 'Inspection recorded' }
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
  return { success: 'Inspection approved' }
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
  return { success: 'Inspection rejected' }
}

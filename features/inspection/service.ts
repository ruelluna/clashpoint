import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { getRegistrationForEvent } from '@/features/registrations/queries'
import type {
  ApproveInspectionInput,
  RecordInspectionInput,
  RejectInspectionInput,
} from '@/features/inspection/schema'
import { createExtendedClient } from '@/lib/supabase/extended'

export async function recordInspection(
  actorId: string,
  input: RecordInspectionInput
): Promise<{ error?: string; inspectionId?: string }> {
  const registration = await getRegistrationForEvent(input.eventId, input.registrationId)
  if (!registration) return { error: 'Registration not found for this event' }

  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { data: existing } = await supabase
    .from('physical_inspections')
    .select('id')
    .eq('registration_id', input.registrationId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  const payload = {
    registration_id: input.registrationId,
    event_id: input.eventId,
    inspection_status: input.inspectionStatus,
    notes: input.notes ?? null,
    inspected_by: actorId,
    inspected_at: now,
    updated_at: now,
  }

  const { data, error } = existing
    ? await supabase
        .from('physical_inspections')
        .update(payload)
        .eq('id', existing.id)
        .select('id')
        .single()
    : await supabase.from('physical_inspections').insert(payload).select('id').single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to record inspection' }
  }

  const registrationInspectionStatus =
    input.inspectionStatus === 'passed'
      ? 'passed'
      : input.inspectionStatus === 'failed'
        ? 'failed'
        : input.inspectionStatus

  await supabase
    .from('rooster_event_registrations')
    .update({
      inspection_status: registrationInspectionStatus,
      updated_at: now,
    })
    .eq('id', input.registrationId)
    .eq('event_id', input.eventId)

  await writeAuditLog({
    actorId,
    action: 'inspection.recorded',
    entityType: 'physical_inspection',
    entityId: data.id,
    newValues: {
      event_id: input.eventId,
      registration_id: input.registrationId,
      inspection_status: input.inspectionStatus,
    },
  })

  return { inspectionId: data.id }
}

export async function approveInspection(
  actorId: string,
  input: ApproveInspectionInput
): Promise<{ error?: string }> {
  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { data: inspection, error: fetchError } = await supabase
    .from('physical_inspections')
    .select('id, event_id, registration_id, inspection_status')
    .eq('id', input.inspectionId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!inspection) return { error: 'Inspection not found' }
  if (!inspection.registration_id) {
    return { error: 'Inspection is not linked to a registration' }
  }

  const { error } = await supabase
    .from('physical_inspections')
    .update({
      inspection_status: 'passed',
      notes: input.notes ?? null,
      inspected_by: actorId,
      inspected_at: now,
      updated_at: now,
    })
    .eq('id', input.inspectionId)

  if (error) return { error: error.message }

  await supabase
    .from('rooster_event_registrations')
    .update({
      inspection_status: 'passed',
      updated_at: now,
    })
    .eq('id', inspection.registration_id)
    .eq('event_id', input.eventId)

  await writeAuditLog({
    actorId,
    action: 'inspection.approved',
    entityType: 'physical_inspection',
    entityId: input.inspectionId,
    newValues: {
      event_id: input.eventId,
      registration_id: inspection.registration_id,
      inspection_status: 'passed',
    },
  })

  return {}
}

export async function rejectInspection(
  actorId: string,
  input: RejectInspectionInput
): Promise<{ error?: string }> {
  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { data: inspection, error: fetchError } = await supabase
    .from('physical_inspections')
    .select('id, event_id, registration_id, inspection_status')
    .eq('id', input.inspectionId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!inspection) return { error: 'Inspection not found' }
  if (!inspection.registration_id) {
    return { error: 'Inspection is not linked to a registration' }
  }

  const { error } = await supabase
    .from('physical_inspections')
    .update({
      inspection_status: 'failed',
      notes: input.notes,
      inspected_by: actorId,
      inspected_at: now,
      updated_at: now,
    })
    .eq('id', input.inspectionId)

  if (error) return { error: error.message }

  await supabase
    .from('rooster_event_registrations')
    .update({
      inspection_status: 'failed',
      updated_at: now,
    })
    .eq('id', inspection.registration_id)
    .eq('event_id', input.eventId)

  await writeAuditLog({
    actorId,
    action: 'inspection.rejected',
    entityType: 'physical_inspection',
    entityId: input.inspectionId,
    reason: input.notes,
    newValues: {
      event_id: input.eventId,
      registration_id: inspection.registration_id,
      inspection_status: 'failed',
    },
  })

  return {}
}

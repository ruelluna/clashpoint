import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { getRegistrationForEvent } from '@/features/registrations/queries'
import type {
  ApproveInspectionInput,
  RecordInspectionInput,
  RejectInspectionInput,
} from '@/features/inspection/schema'
import { assertRegistrationTransition } from '@/features/registrations/workflow'
import type { RoosterEventRegistrationRow } from '@/features/registrations/types'
import type { InspectionStatus, RegistrationPaymentStatus } from '@/lib/derby/enums'
import type { WeightStatus } from '@/features/weighing/types'
import { createExtendedClient } from '@/lib/supabase/extended'

type ExtendedClient = Awaited<ReturnType<typeof createExtendedClient>>

async function validateWeightForInspectionPass(
  supabase: ExtendedClient,
  registration: RoosterEventRegistrationRow
): Promise<string | null> {
  if (!registration.weight_verified) {
    return 'Official weight must be verified before inspection can pass'
  }

  const { data: weighing, error } = await supabase
    .from('weighings')
    .select('weight_status, verified_at')
    .eq('rooster_event_registration_id', registration.id)
    .maybeSingle()

  if (error) return error.message
  if (!weighing?.verified_at) {
    return 'Official weight must be verified before inspection can pass'
  }
  if ((weighing.weight_status as WeightStatus) !== 'passed') {
    return 'Weight must pass before inspection can pass'
  }

  return null
}

function resolvePassRegistrationFields(
  regPaymentStatus: RegistrationPaymentStatus,
  actorId: string,
  now: string
) {
  if (regPaymentStatus === 'paid' || regPaymentStatus === 'not_required') {
    return {
      registration_status: 'approved' as const,
      approval_status: 'approved' as const,
      eligibility_status: 'eligible' as const,
      status: 'verified' as const,
      approved_by: actorId,
      approved_at: now,
    }
  }

  return {
    registration_status: 'conditionally_approved' as const,
    approval_status: 'conditionally_approved' as const,
    eligibility_status: 'conditionally_eligible' as const,
    status: 'verified' as const,
    approved_by: null,
    approved_at: null,
  }
}

function resolveFailedRegistrationFields(actorId: string, now: string) {
  return {
    eligibility_status: 'ineligible' as const,
    registration_status: 'rejected' as const,
    approval_status: 'rejected' as const,
    status: 'rejected' as const,
    rejection_category: 'inspection_failed' as const,
    rejected_by: actorId,
    rejected_at: now,
  }
}

async function applyInspectionRegistrationUpdate(input: {
  supabase: ExtendedClient
  registration: RoosterEventRegistrationRow
  inspectionStatus: InspectionStatus
  actorId: string
  now: string
}): Promise<{ error?: string }> {
  const { supabase, registration, inspectionStatus, actorId, now } = input
  const currentStatus = registration.registration_status

  if (inspectionStatus === 'passed') {
    const weightError = await validateWeightForInspectionPass(supabase, registration)
    if (weightError) return { error: weightError }

    const nextFields = resolvePassRegistrationFields(
      registration.reg_payment_status,
      actorId,
      now
    )
    const transitionError = assertRegistrationTransition(
      currentStatus,
      nextFields.registration_status
    )
    if (transitionError) return { error: transitionError }

    await supabase
      .from('rooster_event_registrations')
      .update({
        inspection_status: 'passed',
        updated_at: now,
        ...nextFields,
      })
      .eq('id', registration.id)
      .eq('event_id', registration.event_id)

    return {}
  }

  if (inspectionStatus === 'failed') {
    const nextFields = resolveFailedRegistrationFields(actorId, now)
    const transitionError = assertRegistrationTransition(
      currentStatus,
      nextFields.registration_status
    )
    if (transitionError) return { error: transitionError }

    await supabase
      .from('rooster_event_registrations')
      .update({
        inspection_status: 'failed',
        updated_at: now,
        ...nextFields,
      })
      .eq('id', registration.id)
      .eq('event_id', registration.event_id)

    return {}
  }

  await supabase
    .from('rooster_event_registrations')
    .update({
      inspection_status: inspectionStatus,
      updated_at: now,
    })
    .eq('id', registration.id)
    .eq('event_id', registration.event_id)

  return {}
}

async function applyInspectionOutcome(
  actorId: string,
  input: {
    eventId: string
    registrationId: string
    inspectionStatus: InspectionStatus
    notes?: string
    existingInspectionId?: string
  }
): Promise<{ error?: string; inspectionId?: string }> {
  const registration = await getRegistrationForEvent(input.eventId, input.registrationId)
  if (!registration) return { error: 'Registration not found for this event' }

  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  if (input.inspectionStatus === 'passed') {
    const weightError = await validateWeightForInspectionPass(supabase, registration)
    if (weightError) return { error: weightError }
  }

  const payload = {
    registration_id: input.registrationId,
    event_id: input.eventId,
    inspection_status: input.inspectionStatus,
    notes: input.notes ?? null,
    inspected_by: actorId,
    inspected_at: now,
    updated_at: now,
  }

  let inspectionId = input.existingInspectionId

  if (inspectionId) {
    const { error } = await supabase
      .from('physical_inspections')
      .update(payload)
      .eq('id', inspectionId)

    if (error) return { error: error.message }
  } else {
    const { data: existing } = await supabase
      .from('physical_inspections')
      .select('id')
      .eq('registration_id', input.registrationId)
      .eq('event_id', input.eventId)
      .maybeSingle()

    if (existing) {
      inspectionId = existing.id
      const { error } = await supabase
        .from('physical_inspections')
        .update(payload)
        .eq('id', existing.id)

      if (error) return { error: error.message }
    } else {
      const { data, error } = await supabase
        .from('physical_inspections')
        .insert(payload)
        .select('id')
        .single()

      if (error || !data) {
        return { error: error?.message ?? 'Failed to record inspection' }
      }
      inspectionId = data.id
    }
  }

  const updateResult = await applyInspectionRegistrationUpdate({
    supabase,
    registration,
    inspectionStatus: input.inspectionStatus,
    actorId,
    now,
  })

  if (updateResult.error) return updateResult

  return { inspectionId }
}

export async function recordInspection(
  actorId: string,
  input: RecordInspectionInput
): Promise<{ error?: string; inspectionId?: string }> {
  const result = await applyInspectionOutcome(actorId, {
    eventId: input.eventId,
    registrationId: input.registrationId,
    inspectionStatus: input.inspectionStatus,
    notes: input.notes,
  })

  if (result.error || !result.inspectionId) return result

  await writeAuditLog({
    actorId,
    action: 'inspection.recorded',
    entityType: 'physical_inspection',
    entityId: result.inspectionId,
    newValues: {
      event_id: input.eventId,
      registration_id: input.registrationId,
      inspection_status: input.inspectionStatus,
    },
  })

  return result
}

export async function approveInspection(
  actorId: string,
  input: ApproveInspectionInput
): Promise<{ error?: string }> {
  const supabase = await createExtendedClient()

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
  if (inspection.inspection_status !== 'for_review') {
    return { error: 'Only inspections marked for review can be approved' }
  }

  const result = await applyInspectionOutcome(actorId, {
    eventId: input.eventId,
    registrationId: inspection.registration_id,
    inspectionStatus: 'passed',
    notes: input.notes,
    existingInspectionId: input.inspectionId,
  })

  if (result.error) return { error: result.error }

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
  if (inspection.inspection_status !== 'for_review') {
    return { error: 'Only inspections marked for review can be rejected' }
  }

  const result = await applyInspectionOutcome(actorId, {
    eventId: input.eventId,
    registrationId: inspection.registration_id,
    inspectionStatus: 'failed',
    notes: input.notes,
    existingInspectionId: input.inspectionId,
  })

  if (result.error) return { error: result.error }

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

export async function promoteInspectionClearedAfterPayment(
  entryId: string
): Promise<void> {
  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { data: registrations, error } = await supabase
    .from('rooster_event_registrations')
    .select('id, registration_status')
    .eq('entry_id', entryId)
    .eq('inspection_status', 'passed')
    .eq('registration_status', 'conditionally_approved')

  if (error || !registrations?.length) return

  for (const registration of registrations) {
    const transitionError = assertRegistrationTransition(
      registration.registration_status as never,
      'approved'
    )
    if (transitionError) continue

    await supabase
      .from('rooster_event_registrations')
      .update({
        registration_status: 'approved',
        approval_status: 'approved',
        eligibility_status: 'eligible',
        status: 'verified',
        updated_at: now,
      })
      .eq('id', registration.id)
  }
}

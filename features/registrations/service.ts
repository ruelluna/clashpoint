import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { evaluateDerbyEligibility } from '@/features/eligibility/service'
import {
  getEventWorkflowConfig,
  persistEligibilitySnapshot,
  type EventWorkflowConfig,
} from '@/features/eligibility/registration-bridge'
import {
  getRegistrationForEvent,
  registrationHasActiveMatch,
} from '@/features/registrations/queries'
import type {
  ApproveRegistrationInput,
  ConditionallyApproveRegistrationInput,
  DisqualifyRegistrationInput,
  RejectRegistrationInput,
  RevokeRegistrationApprovalInput,
  SubmitRegistrationInput,
  WithdrawRegistrationInput,
} from '@/features/registrations/schema'
import {
  assertRegistrationTransition,
  resolveSubmitTargetStatus,
} from '@/features/registrations/workflow'
import { createExtendedClient } from '@/lib/supabase/extended'

export async function submitRegistration(
  actorId: string,
  input: SubmitRegistrationInput
): Promise<{ error?: string }> {
  const registration = await getRegistrationForEvent(input.eventId, input.registrationId)
  if (!registration) return { error: 'Registration not found' }

  const eventResult = await getEventWorkflowConfig(input.eventId)
  if (eventResult.error || !eventResult.config) {
    return { error: eventResult.error ?? 'Event configuration unavailable' }
  }

  const eventConfig: EventWorkflowConfig = eventResult.config

  const targetStatus = resolveSubmitTargetStatus({
    weightVerificationRequired: eventConfig.weight_verification_required,
    physicalInspectionRequired: eventConfig.physical_inspection_required,
    documentVerificationRequired: eventConfig.document_verification_required,
    bandVerificationRequired: eventConfig.band_verification_required,
    requireRoosterEntryApproval: eventConfig.require_rooster_entry_approval,
  })

  const transitionError = assertRegistrationTransition(
    registration.registration_status,
    targetStatus
  )
  if (transitionError) return { error: transitionError }

  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('rooster_event_registrations')
    .update({
      registration_status: targetStatus,
      approval_status: 'pending',
      submitted_by: actorId,
      submitted_at: now,
      updated_at: now,
    })
    .eq('id', input.registrationId)
    .eq('event_id', input.eventId)

  if (error) return { error: error.message }

  if (eventConfig.eligibility_enforcement_enabled) {
    const eligibilityResult = await persistEligibilitySnapshot(
      actorId,
      input.eventId,
      input.registrationId
    )
    if (eligibilityResult.error) return { error: eligibilityResult.error }
  }

  await writeAuditLog({
    actorId,
    action: 'registration.submitted',
    entityType: 'rooster_event_registration',
    entityId: input.registrationId,
    newValues: {
      event_id: input.eventId,
      registration_status: targetStatus,
    },
  })

  return {}
}

export async function approveRegistration(
  actorId: string,
  input: ApproveRegistrationInput
): Promise<{ error?: string }> {
  const registration = await getRegistrationForEvent(input.eventId, input.registrationId)
  if (!registration) return { error: 'Registration not found' }

  const transitionError = assertRegistrationTransition(
    registration.registration_status,
    'approved'
  )
  if (transitionError) return { error: transitionError }

  if (registration.approval_status === 'revoked') {
    return { error: 'Approval was revoked — resubmit before approving again' }
  }

  const eventResult = await getEventWorkflowConfig(input.eventId)
  if (eventResult.error) return { error: eventResult.error }

  if (eventResult.config?.eligibility_enforcement_enabled) {
    const evaluation = await evaluateDerbyEligibility(input.eventId, input.registrationId)
    if (evaluation.status === 'ineligible') {
      return { error: 'Registration is ineligible and cannot be approved' }
    }
  }

  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('rooster_event_registrations')
    .update({
      registration_status: 'approved',
      approval_status: 'approved',
      approved_by: actorId,
      approved_at: now,
      approval_notes: input.approvalNotes ?? null,
      reviewed_by: actorId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('id', input.registrationId)
    .eq('event_id', input.eventId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'registration.approved',
    entityType: 'rooster_event_registration',
    entityId: input.registrationId,
    newValues: {
      event_id: input.eventId,
      approval_notes: input.approvalNotes ?? null,
    },
  })

  return {}
}

export async function conditionallyApproveRegistration(
  actorId: string,
  input: ConditionallyApproveRegistrationInput
): Promise<{ error?: string }> {
  const registration = await getRegistrationForEvent(input.eventId, input.registrationId)
  if (!registration) return { error: 'Registration not found' }

  const transitionError = assertRegistrationTransition(
    registration.registration_status,
    'conditionally_approved'
  )
  if (transitionError) return { error: transitionError }

  const eventResult = await getEventWorkflowConfig(input.eventId)
  if (eventResult.error || !eventResult.config?.allow_conditional_approval) {
    return { error: 'Conditional approval is not enabled for this event' }
  }

  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('rooster_event_registrations')
    .update({
      registration_status: 'conditionally_approved',
      approval_status: 'conditionally_approved',
      eligibility_status: 'conditionally_eligible',
      conditional_approval_condition: input.condition,
      conditional_approval_deadline: input.deadline ?? null,
      approval_notes: input.approvalNotes ?? null,
      reviewed_by: actorId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('id', input.registrationId)
    .eq('event_id', input.eventId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'registration.conditionally_approved',
    entityType: 'rooster_event_registration',
    entityId: input.registrationId,
    reason: input.condition,
    newValues: {
      event_id: input.eventId,
      conditional_approval_deadline: input.deadline ?? null,
    },
  })

  return {}
}

export async function rejectRegistration(
  actorId: string,
  input: RejectRegistrationInput
): Promise<{ error?: string }> {
  const registration = await getRegistrationForEvent(input.eventId, input.registrationId)
  if (!registration) return { error: 'Registration not found' }

  const transitionError = assertRegistrationTransition(
    registration.registration_status,
    'rejected'
  )
  if (transitionError) return { error: transitionError }

  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('rooster_event_registrations')
    .update({
      registration_status: 'rejected',
      approval_status: 'rejected',
      eligibility_status: 'ineligible',
      rejected_by: actorId,
      rejected_at: now,
      rejection_category: input.rejectionCategory,
      rejection_reason: input.rejectionReason,
      reviewed_by: actorId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('id', input.registrationId)
    .eq('event_id', input.eventId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'registration.rejected',
    entityType: 'rooster_event_registration',
    entityId: input.registrationId,
    reason: input.rejectionReason,
    newValues: {
      event_id: input.eventId,
      rejection_category: input.rejectionCategory,
    },
  })

  return {}
}

export async function revokeRegistrationApproval(
  actorId: string,
  input: RevokeRegistrationApprovalInput
): Promise<{ error?: string }> {
  const registration = await getRegistrationForEvent(input.eventId, input.registrationId)
  if (!registration) return { error: 'Registration not found' }

  if (registration.approval_status !== 'approved' && registration.approval_status !== 'conditionally_approved') {
    return { error: 'Only approved registrations can be revoked' }
  }

  const hasMatch = await registrationHasActiveMatch(input.eventId, input.registrationId)
  if (hasMatch) {
    return { error: 'Registration is assigned to a match and cannot be revoked' }
  }

  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('rooster_event_registrations')
    .update({
      registration_status: 'pending_review',
      approval_status: 'revoked',
      approved_by: null,
      approved_at: null,
      conditional_approval_condition: null,
      conditional_approval_deadline: null,
      eligibility_status: 'pending_review',
      reviewed_by: actorId,
      reviewed_at: now,
      updated_at: now,
    })
    .eq('id', input.registrationId)
    .eq('event_id', input.eventId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'registration.approval_revoked',
    entityType: 'rooster_event_registration',
    entityId: input.registrationId,
    reason: input.reason,
    newValues: {
      event_id: input.eventId,
      approval_status: 'revoked',
    },
  })

  return {}
}

export async function withdrawRegistration(
  actorId: string,
  input: WithdrawRegistrationInput
): Promise<{ error?: string }> {
  const registration = await getRegistrationForEvent(input.eventId, input.registrationId)
  if (!registration) return { error: 'Registration not found' }

  const transitionError = assertRegistrationTransition(
    registration.registration_status,
    'withdrawn'
  )
  if (transitionError) return { error: transitionError }

  const hasMatch = await registrationHasActiveMatch(input.eventId, input.registrationId)
  if (hasMatch) {
    return { error: 'Registration is assigned to a match and cannot be withdrawn' }
  }

  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('rooster_event_registrations')
    .update({
      registration_status: 'withdrawn',
      withdrawn_by: actorId,
      withdrawn_at: now,
      withdrawal_reason: input.withdrawalReason,
      updated_at: now,
    })
    .eq('id', input.registrationId)
    .eq('event_id', input.eventId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'registration.withdrawn',
    entityType: 'rooster_event_registration',
    entityId: input.registrationId,
    reason: input.withdrawalReason,
    newValues: { event_id: input.eventId },
  })

  return {}
}

export async function disqualifyRegistration(
  actorId: string,
  input: DisqualifyRegistrationInput
): Promise<{ error?: string }> {
  const registration = await getRegistrationForEvent(input.eventId, input.registrationId)
  if (!registration) return { error: 'Registration not found' }

  const transitionError = assertRegistrationTransition(
    registration.registration_status,
    'disqualified'
  )
  if (transitionError) return { error: transitionError }

  const supabase = await createExtendedClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('rooster_event_registrations')
    .update({
      registration_status: 'disqualified',
      approval_status: 'rejected',
      eligibility_status: 'ineligible',
      disqualified_by: actorId,
      disqualified_at: now,
      disqualification_reason: input.disqualificationReason,
      updated_at: now,
    })
    .eq('id', input.registrationId)
    .eq('event_id', input.eventId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'registration.disqualified',
    entityType: 'rooster_event_registration',
    entityId: input.registrationId,
    reason: input.disqualificationReason,
    newValues: { event_id: input.eventId },
  })

  return {}
}

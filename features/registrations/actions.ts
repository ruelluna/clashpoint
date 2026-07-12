'use server'

import { revalidatePath } from 'next/cache'

import {
  approveRegistrationSchema,
  conditionallyApproveRegistrationSchema,
  disqualifyRegistrationSchema,
  rejectRegistrationSchema,
  revokeRegistrationApprovalSchema,
  submitRegistrationSchema,
  withdrawRegistrationSchema,
} from '@/features/registrations/schema'
import {
  approveRegistration,
  conditionallyApproveRegistration,
  disqualifyRegistration,
  rejectRegistration,
  revokeRegistrationApproval,
  submitRegistration,
  withdrawRegistration,
} from '@/features/registrations/service'
import { requirePermission } from '@/lib/auth/permissions'

export type RegistrationActionState = { error?: string; success?: string }

function revalidateRegistrationPaths(eventId: string, registrationId?: string) {
  revalidatePath(`/dashboard/events/${eventId}/registrations`)
  revalidatePath(`/dashboard/events/${eventId}/rooster-entries`)
  revalidatePath(`/dashboard/events/${eventId}/matching`)
  if (registrationId) {
    revalidatePath(`/dashboard/events/${eventId}/registrations/${registrationId}`)
  }
}

export async function submitRegistrationAction(
  _prev: RegistrationActionState,
  formData: FormData
): Promise<RegistrationActionState> {
  const profile = await requirePermission('rooster_event_registration.submit')

  const parsed = submitRegistrationSchema.safeParse({
    eventId: formData.get('eventId'),
    registrationId: formData.get('registrationId'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await submitRegistration(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateRegistrationPaths(parsed.data.eventId, parsed.data.registrationId)
  return { success: 'Registration submitted for review' }
}

export async function approveRegistrationAction(
  _prev: RegistrationActionState,
  formData: FormData
): Promise<RegistrationActionState> {
  const profile = await requirePermission('rooster_event_registration.approve')

  const parsed = approveRegistrationSchema.safeParse({
    eventId: formData.get('eventId'),
    registrationId: formData.get('registrationId'),
    approvalNotes: formData.get('approvalNotes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await approveRegistration(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateRegistrationPaths(parsed.data.eventId, parsed.data.registrationId)
  revalidatePath('/dashboard/audit')
  return { success: 'Registration approved' }
}

export async function conditionallyApproveRegistrationAction(
  _prev: RegistrationActionState,
  formData: FormData
): Promise<RegistrationActionState> {
  const profile = await requirePermission('rooster_event_registration.conditionally_approve')

  const parsed = conditionallyApproveRegistrationSchema.safeParse({
    eventId: formData.get('eventId'),
    registrationId: formData.get('registrationId'),
    condition: formData.get('condition'),
    deadline: formData.get('deadline')?.toString().trim() || undefined,
    approvalNotes: formData.get('approvalNotes')?.toString().trim() || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await conditionallyApproveRegistration(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateRegistrationPaths(parsed.data.eventId, parsed.data.registrationId)
  return { success: 'Registration conditionally approved' }
}

export async function rejectRegistrationAction(
  _prev: RegistrationActionState,
  formData: FormData
): Promise<RegistrationActionState> {
  const profile = await requirePermission('rooster_event_registration.reject')

  const parsed = rejectRegistrationSchema.safeParse({
    eventId: formData.get('eventId'),
    registrationId: formData.get('registrationId'),
    rejectionCategory: formData.get('rejectionCategory'),
    rejectionReason: formData.get('rejectionReason'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await rejectRegistration(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateRegistrationPaths(parsed.data.eventId, parsed.data.registrationId)
  return { success: 'Registration rejected' }
}

export async function revokeRegistrationApprovalAction(
  _prev: RegistrationActionState,
  formData: FormData
): Promise<RegistrationActionState> {
  const profile = await requirePermission('rooster_event_registration.revoke_approval')

  const parsed = revokeRegistrationApprovalSchema.safeParse({
    eventId: formData.get('eventId'),
    registrationId: formData.get('registrationId'),
    reason: formData.get('reason'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await revokeRegistrationApproval(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateRegistrationPaths(parsed.data.eventId, parsed.data.registrationId)
  return { success: 'Approval revoked' }
}

export async function withdrawRegistrationAction(
  _prev: RegistrationActionState,
  formData: FormData
): Promise<RegistrationActionState> {
  const profile = await requirePermission('rooster_event_registration.withdraw')

  const parsed = withdrawRegistrationSchema.safeParse({
    eventId: formData.get('eventId'),
    registrationId: formData.get('registrationId'),
    withdrawalReason: formData.get('withdrawalReason'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await withdrawRegistration(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateRegistrationPaths(parsed.data.eventId, parsed.data.registrationId)
  return { success: 'Registration withdrawn' }
}

export async function disqualifyRegistrationAction(
  _prev: RegistrationActionState,
  formData: FormData
): Promise<RegistrationActionState> {
  const profile = await requirePermission('rooster_event_registration.disqualify')

  const parsed = disqualifyRegistrationSchema.safeParse({
    eventId: formData.get('eventId'),
    registrationId: formData.get('registrationId'),
    disqualificationReason: formData.get('disqualificationReason'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await disqualifyRegistration(profile.id, parsed.data)
  if (result.error) return { error: result.error }

  revalidateRegistrationPaths(parsed.data.eventId, parsed.data.registrationId)
  return { success: 'Registration disqualified' }
}

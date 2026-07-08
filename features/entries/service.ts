import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import { listEntryNumbersForEvent } from '@/features/entries/queries'
import { getNextEntryNumber } from '@/features/entries/schema'
import type {
  ApproveEntryInput,
  CreateEntryInput,
  RejectEntryInput,
} from '@/features/entries/schema'
import type { PaymentStatus, RegistrationStatus } from '@/features/entries/types'
import { createClient } from '@/lib/supabase/server'

export { canSubmitLineup } from '@/features/entries/schema'

const OPEN_REGISTRATION_STATUSES: RegistrationStatus[] = [
  'submitted',
  'pending_review',
  'approved',
]

export async function createEntry(
  actorId: string,
  input: CreateEntryInput
): Promise<{ error?: string; entryId?: string }> {
  const supabase = await createClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name, status, max_entries')
    .eq('id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (eventError) return { error: eventError.message }
  if (!event) return { error: 'Event not found' }
  if (event.status !== 'open') {
    return { error: 'Registrations are only accepted while the event is open' }
  }

  if (event.max_entries != null) {
    const { count, error: countError } = await supabase
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', input.eventId)
      .is('deleted_at', null)
      .not('registration_status', 'in', '("rejected","cancelled")')

    if (countError) return { error: countError.message }
    if ((count ?? 0) >= event.max_entries) {
      return { error: 'Maximum entries reached for this event' }
    }
  }

  const existingNumbers = await listEntryNumbersForEvent(input.eventId)
  const entryNumber = getNextEntryNumber(existingNumbers)

  const { data, error } = await supabase
    .from('entries')
    .insert({
      event_id: input.eventId,
      referred_by_promoter_id: input.referredByPromoterId ?? null,
      entry_number: entryNumber,
      entry_name: input.entryName,
      owner_name: input.ownerName,
      handler_name: input.handlerName ?? null,
      contact_number: input.contactNumber ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      entry_source: input.entrySource,
      registration_status: 'submitted',
      payment_status: 'unpaid',
      notes: input.notes ?? null,
      created_by: actorId,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to create entry' }
  }

  await writeAuditLog({
    actorId,
    action: 'entry.created',
    entityType: 'entry',
    entityId: data.id,
    newValues: {
      event_id: input.eventId,
      event_name: event.name,
      entry_number: entryNumber,
      entry_name: input.entryName,
      owner_name: input.ownerName,
    },
  })

  return { entryId: data.id }
}

export async function approveEntry(
  actorId: string,
  input: ApproveEntryInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('entries')
    .select('id, event_id, entry_number, entry_name, registration_status, payment_status')
    .eq('id', input.entryId)
    .eq('event_id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Entry not found' }

  const currentStatus = existing.registration_status as RegistrationStatus
  if (!OPEN_REGISTRATION_STATUSES.includes(currentStatus)) {
    return { error: 'Entry cannot be approved in its current status' }
  }

  const nextStatus: RegistrationStatus =
    existing.payment_status === 'paid' ? 'confirmed' : 'approved'

  const { error } = await supabase
    .from('entries')
    .update({ registration_status: nextStatus })
    .eq('id', input.entryId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'entry.approved',
    entityType: 'entry',
    entityId: input.entryId,
    oldValues: {
      registration_status: currentStatus,
      entry_number: existing.entry_number,
    },
    newValues: {
      registration_status: nextStatus,
      entry_name: existing.entry_name,
    },
    reason: input.reason,
  })

  return {}
}

export async function rejectEntry(
  actorId: string,
  input: RejectEntryInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('entries')
    .select('id, event_id, entry_number, entry_name, registration_status')
    .eq('id', input.entryId)
    .eq('event_id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!existing) return { error: 'Entry not found' }

  const currentStatus = existing.registration_status as RegistrationStatus
  if (currentStatus === 'rejected' || currentStatus === 'cancelled') {
    return { error: 'Entry is already rejected or cancelled' }
  }

  const { error } = await supabase
    .from('entries')
    .update({ registration_status: 'rejected' })
    .eq('id', input.entryId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'entry.rejected',
    entityType: 'entry',
    entityId: input.entryId,
    oldValues: {
      registration_status: currentStatus,
      entry_number: existing.entry_number,
    },
    newValues: {
      registration_status: 'rejected',
      entry_name: existing.entry_name,
    },
    reason: input.reason,
  })

  return {}
}

export async function syncEntryRegistrationAfterPayment(
  entryId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: entry, error: fetchError } = await supabase
    .from('entries')
    .select('registration_status, payment_status')
    .eq('id', entryId)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!entry) return { error: 'Entry not found' }

  const registrationStatus = entry.registration_status as RegistrationStatus
  const paymentStatus = entry.payment_status as PaymentStatus

  if (
    paymentStatus === 'paid' &&
    (registrationStatus === 'approved' ||
      registrationStatus === 'submitted' ||
      registrationStatus === 'pending_review')
  ) {
    const { error } = await supabase
      .from('entries')
      .update({ registration_status: 'confirmed' })
      .eq('id', entryId)

    if (error) return { error: error.message }
  }

  return {}
}

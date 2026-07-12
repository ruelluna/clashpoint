import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import {
  calculateBalance,
  getNextPaymentReference,
  type RecordPaymentInput,
  type RefundPaymentInput,
} from '@/features/payments/schema'
import type { PaymentStatus } from '@/features/entries/types'
import type { PaymentLedgerItem } from '@/features/payments/types'
import { createClient } from '@/lib/supabase/server'

export { calculateBalance } from '@/features/payments/schema'

type PaymentLedgerRow = {
  id: string
  payment_reference: string
  entry_id: string
  amount_due: number
  amount_paid: number
  balance: number
  payment_method: string | null
  receipt_number: string | null
  payment_status: PaymentStatus
  paid_at: string | null
  notes: string | null
  created_at: string
  entries: {
    entry_number: string
    entry_name: string
    owner_name: string
  } | null
}

export type { PaymentLedgerItem } from '@/features/payments/types'

export async function listPaymentsByEvent(eventId: string): Promise<PaymentLedgerItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select(
      `
      id,
      payment_reference,
      entry_id,
      amount_due,
      amount_paid,
      balance,
      payment_method,
      receipt_number,
      payment_status,
      paid_at,
      notes,
      created_at,
      entries ( entry_number, entry_name, owner_name )
    `
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return ((data ?? []) as unknown as PaymentLedgerRow[]).map((row) => ({
    id: row.id,
    paymentReference: row.payment_reference,
    entryId: row.entry_id,
    entryNumber: row.entries?.entry_number ?? '—',
    entryName: row.entries?.entry_name ?? '—',
    ownerName: row.entries?.owner_name ?? '—',
    amountDue: Number(row.amount_due),
    amountPaid: Number(row.amount_paid),
    balance: Number(row.balance),
    paymentMethod: row.payment_method,
    receiptNumber: row.receipt_number,
    paymentStatus: row.payment_status,
    paidAt: row.paid_at,
    notes: row.notes,
    createdAt: row.created_at,
  }))
}

async function listPaymentReferencesForEvent(eventId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('payment_reference')
    .eq('event_id', eventId)

  if (error) throw error
  return (data ?? []).map((row) => row.payment_reference as string)
}

async function getEntryPaymentTotals(
  entryId: string
): Promise<{ totalPaid: number; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('amount_paid, payment_status')
    .eq('entry_id', entryId)
    .neq('payment_status', 'refunded')

  if (error) return { totalPaid: 0, error: error.message }

  const totalPaid = (data ?? []).reduce(
    (sum, row) => sum + Number(row.amount_paid),
    0
  )

  return { totalPaid }
}

export async function updateEntryPaymentStatus(
  entryId: string,
  amountDue: number
): Promise<{ error?: string; paymentStatus?: PaymentStatus }> {
  const supabase = await createClient()
  const { totalPaid, error: totalsError } = await getEntryPaymentTotals(entryId)

  if (totalsError) return { error: totalsError }

  const { paymentStatus } = calculateBalance(amountDue, totalPaid)

  const { error } = await supabase
    .from('entries')
    .update({ payment_status: paymentStatus })
    .eq('id', entryId)

  if (error) return { error: error.message }

  return { paymentStatus }
}

export async function recordPayment(
  actorId: string,
  input: RecordPaymentInput
): Promise<{ error?: string; paymentId?: string }> {
  const supabase = await createClient()

  const { data: entry, error: entryError } = await supabase
    .from('entries')
    .select('id, event_id, entry_number, entry_name, registration_status, payment_status')
    .eq('id', input.entryId)
    .eq('event_id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (entryError) return { error: entryError.message }
  if (!entry) return { error: 'Entry not found' }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('entry_fee')
    .eq('id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (eventError) return { error: eventError.message }
  if (!event) return { error: 'Event not found' }

  const amountDue = Number(event.entry_fee)
  const { totalPaid: existingPaid, error: totalsError } = await getEntryPaymentTotals(
    input.entryId
  )

  if (totalsError) return { error: totalsError }

  const projectedTotal = existingPaid + input.amountPaid
  const { balance, paymentStatus } = calculateBalance(amountDue, projectedTotal)

  if (projectedTotal > amountDue) {
    return { error: 'Payment exceeds the entry fee due' }
  }

  const references = await listPaymentReferencesForEvent(input.eventId)
  const paymentReference = getNextPaymentReference(input.eventId, references)

  const { data, error } = await supabase
    .from('payments')
    .insert({
      payment_reference: paymentReference,
      entry_id: input.entryId,
      event_id: input.eventId,
      amount_due: amountDue,
      amount_paid: input.amountPaid,
      balance,
      payment_method: input.paymentMethod,
      receipt_number: input.receiptNumber ?? null,
      payment_status: paymentStatus,
      received_by: actorId,
      paid_at: new Date().toISOString(),
      notes: input.notes ?? null,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { error: error?.message ?? 'Failed to record payment' }
  }

  const statusResult = await updateEntryPaymentStatus(input.entryId, amountDue)
  if (statusResult.error) return { error: statusResult.error }

  await writeAuditLog({
    actorId,
    action: 'payment.recorded',
    entityType: 'payment',
    entityId: data.id,
    newValues: {
      payment_reference: paymentReference,
      entry_id: input.entryId,
      entry_number: entry.entry_number,
      entry_name: entry.entry_name,
      amount_paid: input.amountPaid,
      balance,
      payment_status: paymentStatus,
    },
  })

  return { paymentId: data.id }
}

export async function refundPayment(
  actorId: string,
  input: RefundPaymentInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select(
      'id, payment_reference, entry_id, event_id, amount_due, amount_paid, payment_status'
    )
    .eq('id', input.paymentId)
    .eq('event_id', input.eventId)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!payment) return { error: 'Payment not found' }
  if (payment.payment_status === 'refunded') {
    return { error: 'Payment is already refunded' }
  }

  const { error } = await supabase
    .from('payments')
    .update({
      payment_status: 'refunded',
      balance: Number(payment.amount_due),
      amount_paid: 0,
    })
    .eq('id', input.paymentId)

  if (error) return { error: error.message }

  const statusResult = await updateEntryPaymentStatus(
    payment.entry_id,
    Number(payment.amount_due)
  )
  if (statusResult.error) return { error: statusResult.error }

  await writeAuditLog({
    actorId,
    action: 'payment.refunded',
    entityType: 'payment',
    entityId: input.paymentId,
    oldValues: {
      payment_reference: payment.payment_reference,
      payment_status: payment.payment_status,
      amount_paid: payment.amount_paid,
    },
    newValues: {
      payment_status: 'refunded',
      entry_id: payment.entry_id,
    },
    reason: input.reason,
  })

  return {}
}

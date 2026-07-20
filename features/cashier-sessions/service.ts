import 'server-only'

import { writeAuditLog } from '@/features/audit/service'
import {
  getCashierSessionById,
  getOpenCashierSessionForStaff,
} from '@/features/cashier-sessions/queries'
import type {
  CloseCashierSessionInput,
  OpenCashierSessionInput,
  RecordAdminHandoverInput,
} from '@/features/cashier-sessions/schema'
import type { CashierSessionSummary } from '@/features/cashier-sessions/types'
import { postRevolvingFundLedgerEntry } from '@/features/revolving-fund/service'
import { createClient } from '@/lib/supabase/server'

function roundMoney(value: number): number {
  return Number(value.toFixed(2))
}

export async function openCashierSession(
  actorId: string,
  input: OpenCashierSessionInput
): Promise<{ error?: string; session?: CashierSessionSummary }> {
  const supabase = await createClient()

  const existing = await getOpenCashierSessionForStaff(input.eventId, actorId)
  if (existing) {
    return { error: 'You already have an open cashier session for this event', session: existing }
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name')
    .eq('id', input.eventId)
    .is('deleted_at', null)
    .maybeSingle()

  if (eventError) return { error: eventError.message }
  if (!event) return { error: 'Event not found' }

  const openingFloatAmount = roundMoney(input.openingFloatAmount)
  const openingFloatDefault = roundMoney(input.openingFloatDefault)

  const { data: session, error: sessionError } = await supabase
    .from('cashier_sessions')
    .insert({
      event_id: input.eventId,
      staff_user_id: actorId,
      opening_float_amount: openingFloatAmount,
      opening_float_default: openingFloatDefault,
      opening_float_note: input.openingFloatNote ?? null,
      status: 'open',
    })
    .select('id')
    .single()

  if (sessionError || !session) {
    return { error: sessionError?.message ?? 'Failed to open cashier session' }
  }

  const { error: movementError } = await supabase.from('cashier_session_movements').insert({
    cashier_session_id: session.id,
    event_id: input.eventId,
    movement_type: 'opening_float',
    amount: openingFloatAmount,
    description: `Opening float for ${event.name}`,
    recorded_by: actorId,
  })

  if (movementError) {
    await supabase.from('cashier_sessions').delete().eq('id', session.id)
    return { error: movementError.message }
  }

  await writeAuditLog({
    actorId,
    action: 'cashier_session.opened',
    entityType: 'cashier_session',
    entityId: session.id,
    newValues: {
      event_id: input.eventId,
      opening_float_amount: openingFloatAmount,
      opening_float_default: openingFloatDefault,
      opening_float_note: input.openingFloatNote ?? null,
    },
  })

  const summary = await getCashierSessionById(session.id)
  if (!summary) return { error: 'Failed to load cashier session' }

  return { session: summary }
}

export async function closeCashierSession(
  actorId: string,
  input: CloseCashierSessionInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const session = await getCashierSessionById(input.sessionId)
  if (!session) return { error: 'Cashier session not found' }
  if (session.eventId !== input.eventId) return { error: 'Session does not belong to this event' }
  if (session.staffUserId !== actorId) return { error: 'You can only close your own cashier session' }
  if (session.status !== 'open') return { error: 'Cashier session is already closed' }

  const { error } = await supabase
    .from('cashier_sessions')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      closing_counted_cash:
        input.closingCountedCash != null ? roundMoney(input.closingCountedCash) : null,
      closing_notes: input.closingNotes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.sessionId)

  if (error) return { error: error.message }

  await writeAuditLog({
    actorId,
    action: 'cashier_session.closed',
    entityType: 'cashier_session',
    entityId: input.sessionId,
    newValues: {
      closing_counted_cash: input.closingCountedCash ?? null,
      closing_notes: input.closingNotes ?? null,
    },
  })

  return {}
}

export async function recordAdminHandover(
  actorId: string,
  input: RecordAdminHandoverInput
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const session = await getCashierSessionById(input.sessionId)
  if (!session) return { error: 'Cashier session not found' }
  if (session.eventId !== input.eventId) return { error: 'Session does not belong to this event' }
  if (session.staffUserId !== actorId) return { error: 'You can only record handovers on your session' }
  if (session.status !== 'open') return { error: 'Cashier session is closed' }

  const amount = roundMoney(input.amount)
  const description = input.description.trim()

  const { error: movementError } = await supabase.from('cashier_session_movements').insert({
    cashier_session_id: input.sessionId,
    event_id: input.eventId,
    movement_type: 'admin_handover',
    amount,
    description,
    admin_user_id: input.adminUserId ?? null,
    recorded_by: actorId,
  })

  if (movementError) return { error: movementError.message }

  const adminLabel = input.adminUserId ? 'admin' : 'unspecified admin'
  const fundResult = await postRevolvingFundLedgerEntry({
    eventId: input.eventId,
    amount,
    entryType: 'adjustment',
    description: `Admin handover from cashier session — ${description} (${adminLabel})`,
    actorId,
    cashierSessionId: input.sessionId,
  })

  if (fundResult.error) return { error: fundResult.error }

  await writeAuditLog({
    actorId,
    action: 'cashier_session.admin_handover',
    entityType: 'cashier_session',
    entityId: input.sessionId,
    newValues: {
      amount,
      description,
      admin_user_id: input.adminUserId ?? null,
    },
  })

  return {}
}

export async function requireOpenCashierSession(
  actorId: string,
  eventId: string
): Promise<{ error?: string; session?: CashierSessionSummary }> {
  const session = await getOpenCashierSessionForStaff(eventId, actorId)
  if (!session) {
    return { error: 'Open a cashier session before recording transactions' }
  }

  return { session }
}

export async function validateCashierSessionForPayment(
  actorId: string,
  eventId: string,
  cashierSessionId: string
): Promise<{ error?: string; session?: CashierSessionSummary }> {
  const session = await getCashierSessionById(cashierSessionId)
  if (!session) return { error: 'Cashier session not found' }
  if (session.eventId !== eventId) return { error: 'Cashier session does not belong to this event' }
  if (session.staffUserId !== actorId) return { error: 'Payment must use your open cashier session' }
  if (session.status !== 'open') return { error: 'Cashier session is closed' }

  return { session }
}

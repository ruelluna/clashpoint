import 'server-only'

import type {
  GlobalTransactionRow,
  GlobalTransactionsFilters,
} from '@/features/transactions/types'
import { listCashierSessionMovementsByEvent, listCashierSessionsByEvent } from '@/features/cashier-sessions/queries'
import { listPaymentsByEvent } from '@/features/payments/service'
import { PAYMENT_CATEGORY_LABELS } from '@/features/payments/schema'

export async function listGlobalTransactionsForEvent(
  eventId: string,
  filters: GlobalTransactionsFilters = {}
): Promise<GlobalTransactionRow[]> {
  const [payments, sessions, movements] = await Promise.all([
    listPaymentsByEvent(eventId),
    listCashierSessionsByEvent(eventId),
    listCashierSessionMovementsByEvent(eventId),
  ])

  const rows: GlobalTransactionRow[] = []

  for (const payment of payments) {
    rows.push({
      id: `payment-${payment.id}`,
      kind: payment.paymentStatus === 'refunded' ? 'refund' : 'payment',
      eventId,
      occurredAt: payment.paidAt ?? payment.createdAt,
      reference: payment.paymentReference,
      description: `${PAYMENT_CATEGORY_LABELS[payment.paymentCategory]} · #${payment.entryNumber} ${payment.entryName}`,
      amount: payment.paymentStatus === 'refunded' ? -payment.amountDue : payment.amountPaid,
      cashierName: payment.cashierName,
      paymentId: payment.id,
      sessionId: payment.cashierSessionId,
    })
  }

  for (const session of sessions) {
    rows.push({
      id: `session-open-${session.id}`,
      kind: 'session_opened',
      eventId,
      occurredAt: session.openedAt,
      reference: session.id.slice(0, 8).toUpperCase(),
      description: `Session opened · float ${session.openingFloatAmount}`,
      amount: session.openingFloatAmount,
      cashierName: session.staffDisplayName,
      paymentId: null,
      sessionId: session.id,
    })

    if (session.closedAt) {
      rows.push({
        id: `session-close-${session.id}`,
        kind: 'session_closed',
        eventId,
        occurredAt: session.closedAt,
        reference: session.id.slice(0, 8).toUpperCase(),
        description: session.closingNotes ?? 'Session closed',
        amount: session.closingCountedCash,
        cashierName: session.staffDisplayName,
        paymentId: null,
        sessionId: session.id,
      })
    }
  }

  for (const movement of movements) {
    if (movement.movementType === 'opening_float') continue

    rows.push({
      id: `movement-${movement.id}`,
      kind: movement.movementType === 'admin_handover' ? 'admin_handover' : 'opening_float',
      eventId,
      occurredAt: movement.createdAt,
      reference: movement.id.slice(0, 8).toUpperCase(),
      description: movement.description,
      amount: movement.movementType === 'admin_handover' ? -movement.amount : movement.amount,
      cashierName: movement.recordedByDisplayName,
      paymentId: null,
      sessionId: movement.cashierSessionId,
    })
  }

  rows.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )

  return rows.filter((row) => {
    if (filters.kind && filters.kind !== 'all' && row.kind !== filters.kind) {
      return false
    }
    return true
  })
}
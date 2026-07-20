export type GlobalTransactionKind =
  | 'payment'
  | 'refund'
  | 'opening_float'
  | 'admin_handover'
  | 'session_opened'
  | 'session_closed'

export type GlobalTransactionRow = {
  id: string
  kind: GlobalTransactionKind
  eventId: string
  occurredAt: string
  reference: string
  description: string
  amount: number | null
  cashierName: string | null
  paymentId: string | null
  sessionId: string | null
}

export type GlobalTransactionsFilters = {
  eventId?: string
  kind?: GlobalTransactionKind | 'all'
  cashierUserId?: string
}

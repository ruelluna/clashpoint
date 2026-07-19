export type CashierSessionStatus = 'open' | 'closed'

export type CashierSessionMovementType = 'opening_float' | 'admin_handover' | 'adjustment'

export type CashierSessionSummary = {
  id: string
  eventId: string
  staffUserId: string
  staffDisplayName: string
  openingFloatAmount: number
  openingFloatDefault: number
  openingFloatNote: string | null
  status: CashierSessionStatus
  openedAt: string
  closedAt: string | null
  closingCountedCash: number | null
  closingNotes: string | null
}

export type CashierSessionMovement = {
  id: string
  cashierSessionId: string
  eventId: string
  movementType: CashierSessionMovementType
  amount: number
  description: string
  adminUserId: string | null
  adminDisplayName: string | null
  recordedBy: string
  recordedByDisplayName: string | null
  createdAt: string
}

export type AdminHandoverCandidate = {
  id: string
  displayName: string
  role: string
}

export type SettlementStatus =
  | 'pending'
  | 'for_review'
  | 'settled'
  | 'disputed'
  | 'cancelled'

export type SettlementRow = {
  id: string
  settlementReference: string
  eventId: string
  promoterId: string
  promoterName: string
  grossCollection: number
  eligibleCollection: number
  totalExpenses: number
  prizePool: number
  promoterCommission: number
  promoterAdvances: number
  guaranteedPrize: number
  amountPayable: number
  amountReceivable: number
  settlementStatus: SettlementStatus
  settledBy: string | null
  settledAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

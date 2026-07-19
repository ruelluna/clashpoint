export type RevolvingFundEntryType =
  | 'opening'
  | 'adjustment'
  | 'collection'
  | 'refund'

export type RevolvingFundLedgerEntry = {
  id: string
  eventId: string
  entryType: RevolvingFundEntryType
  amount: number
  balanceAfter: number
  description: string | null
  sourcePaymentId: string | null
  createdBy: string | null
  createdAt: string
}

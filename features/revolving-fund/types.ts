export type RevolvingFundEntryType = 'opening' | 'adjustment'

export type RevolvingFundLedgerEntry = {
  id: string
  eventId: string
  entryType: RevolvingFundEntryType
  amount: number
  balanceAfter: number
  description: string | null
  createdBy: string | null
  createdAt: string
}

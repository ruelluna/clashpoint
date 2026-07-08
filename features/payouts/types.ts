export type PayoutMethod = 'cash' | 'bank_transfer' | 'gcash' | 'other'

export type PayoutListItem = {
  id: string
  payoutReference: string
  eventId: string
  entryId: string
  entryNumber: string
  entryName: string
  rankLabel: string
  rankPosition: number
  amount: number
  paymentMethod: PayoutMethod | null
  recipientName: string
  releasedBy: string | null
  releasedAt: string | null
  notes: string | null
  createdAt: string
  isReleased: boolean
}

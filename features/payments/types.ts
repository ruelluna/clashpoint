import type { PaymentStatus } from '@/features/entries/types'

export type PaymentLedgerItem = {
  id: string
  paymentReference: string
  entryId: string
  entryNumber: string
  entryName: string
  ownerName: string
  amountDue: number
  amountPaid: number
  balance: number
  paymentMethod: string | null
  receiptNumber: string | null
  paymentStatus: PaymentStatus
  paidAt: string | null
  notes: string | null
  createdAt: string
}

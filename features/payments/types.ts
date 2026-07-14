import type { PaymentStatus } from '@/features/entries/types'
import type { PaymentCategory } from '@/features/payments/fee-calc'

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
  paymentCategory: PaymentCategory
  paidAt: string | null
  notes: string | null
  createdAt: string
}

export type PaymentReceiptItem = PaymentLedgerItem & {
  eventName: string
}

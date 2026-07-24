import type { PaymentStatus } from '@/features/entries/types'
import type { MatchBetPaymentStatus } from '@/features/matches/types'
import type { PaymentCategory } from '@/features/payments/fee-calc'
import type { EntryOutstandingDues } from '@/features/payments/dues'
import type { CashBondRefundEligibility } from '@/features/payments/cash-bond-refund'

export type PaymentLedgerItem = {
  id: string
  paymentReference: string
  entryId: string
  entryNumber: string
  entryName: string
  ownerName: string
  amountDue: number
  amountPaid: number
  amountTendered: number | null
  changeGiven: number | null
  balance: number
  paymentMethod: string | null
  receiptNumber: string | null
  paymentStatus: PaymentStatus
  paymentCategory: PaymentCategory
  paidAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  cashierSessionId: string | null
  cashierName: string | null
  collectionBatchId: string | null
  refundBatchId: string | null
  refundedAmount: number | null
  matchId: string | null
  fightSide: 'meron' | 'wala' | null
  fightNumber: number | null
  betBarcode: string | null
}

export type PaymentReceiptItem = PaymentLedgerItem & {
  eventName: string
  sessionOpenedAt: string | null
}

export type PaymentBatchReceiptLine = {
  category: PaymentCategory
  label: string
  amountDue: number
  previouslyPaid: number
  amountCollected: number
  lineBalance: number
  lineStatus: PaymentStatus
}

export type PaymentBatchReceiptItem = {
  collectionBatchId: string
  paymentReference: string
  eventName: string
  entryId: string
  entryNumber: string
  entryName: string
  ownerName: string
  cashierName: string | null
  sessionOpenedAt: string | null
  paymentMethod: string | null
  amountTendered: number | null
  changeGiven: number | null
  totalCollected: number
  paidAt: string
  entryPaymentStatus: PaymentStatus
  lines: PaymentBatchReceiptLine[]
  priorReceiptReference: string | null
  priorReceiptCollected: number | null
  isFollowUpCollect: boolean
}

export type PaymentRefundBatchReceiptLine = {
  category: PaymentCategory
  label: string
  amountDue: number
  amountCollected: number
  amountRefunded: number
  remainingCollected: number
  lineBalance: number
  lineStatus: PaymentStatus
}

export type PaymentRefundBatchReceiptItem = {
  refundBatchId: string
  refundReference: string
  originalReceiptReference: string
  collectionBatchId: string | null
  eventName: string
  entryId: string
  entryNumber: string
  entryName: string
  ownerName: string
  cashierName: string | null
  reason: string
  totalRefunded: number
  lines: PaymentRefundBatchReceiptLine[]
  refundedAt: string
}

export type PaymentLedgerRowKind = 'collection' | 'refund'

export type PaymentLedgerDisplayRow = {
  id: string
  rowKind: PaymentLedgerRowKind
  collectionBatchId: string | null
  refundBatchId: string | null
  paymentReference: string
  receiptNumber: string | null
  entryId: string
  entryNumber: string
  entryName: string
  ownerName: string
  amountPaid: number
  amountRefunded?: number
  amountTendered: number | null
  changeGiven: number | null
  balance: number
  paymentStatus: PaymentStatus
  paidAt: string | null
  itemsPaid: string[]
  childPayments: PaymentLedgerItem[]
  isBatch: boolean
}

export type CashierTargetMatch = {
  entryId: string
  entryNumber: string
  entryName: string
  ownerName: string
  ownerBarcode: string | null
  roosterCount: number
  paymentStatus: PaymentStatus
  dues: EntryOutstandingDues
  cashBondRefund?: CashBondRefundEligibility
  matchedVia: 'owner_barcode' | 'cock_barcode' | 'search'
}

export type MatchBetCashierTarget = {
  matchBetId: string
  matchId: string
  eventId: string
  fightNumber: number
  side: 'meron' | 'wala'
  betBarcode: string
  betAmount: number
  collectedAmount: number
  adjustmentDelta: number
  betPaymentStatus: MatchBetPaymentStatus
  entryId: string
  entryNumber: string
  entryName: string
  ownerName: string
  cockNumber: number
  bandNumber: string
  entryDues: EntryOutstandingDues
  primaryPaymentId: string | null
}

export type CashierLookupResult = {
  error?: string
  matches?: CashierTargetMatch[]
  matchBet?: MatchBetCashierTarget
}

export type CashierSelectableEntry = {
  id: string
  entryNumber: string
  entryName: string
  ownerName: string
  totalOutstanding: number
}

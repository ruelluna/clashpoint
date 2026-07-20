import type { PaymentStatus } from '@/features/entries/types'
import type { MatchBetPaymentStatus } from '@/features/matches/types'
import type { PaymentCategory } from '@/features/payments/fee-calc'
import type { EntryOutstandingDues } from '@/features/payments/dues'

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
  cashierSessionId: string | null
  cashierName: string | null
  matchId: string | null
  fightSide: 'meron' | 'wala' | null
  fightNumber: number | null
  betBarcode: string | null
}

export type PaymentReceiptItem = PaymentLedgerItem & {
  eventName: string
  sessionOpenedAt: string | null
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
  betPaymentStatus: MatchBetPaymentStatus
  entryId: string
  entryNumber: string
  entryName: string
  ownerName: string
  cockNumber: number
  bandNumber: string
  entryDues: EntryOutstandingDues
}

export type CashierLookupResult = {
  error?: string
  matches?: CashierTargetMatch[]
  matchBet?: MatchBetCashierTarget
}

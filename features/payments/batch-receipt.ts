import type { PaymentStatus } from '@/features/entries/types'
import type { PaymentCategory } from '@/features/payments/fee-calc'
import { REGISTRATION_DUES_CATEGORIES } from '@/features/payments/dues'
import { PAYMENT_CATEGORY_LABELS } from '@/features/payments/schema'
import type { PaymentBatchReceiptLine } from '@/features/payments/types'

export function batchReceiptLineStatus(
  amountDue: number,
  previouslyPaid: number,
  amountCollected: number
): PaymentStatus {
  const totalPaid = previouslyPaid + amountCollected
  if (totalPaid <= 0) {
    return 'unpaid'
  }
  const balance = Math.max(0, Number((amountDue - totalPaid).toFixed(2)))
  if (balance <= 0) {
    return 'paid'
  }
  return 'partial'
}

export function buildBatchReceiptLine(
  category: PaymentCategory,
  amountDue: number,
  previouslyPaid: number,
  amountCollected: number
): PaymentBatchReceiptLine {
  const lineBalance = Math.max(
    0,
    Number((amountDue - previouslyPaid - amountCollected).toFixed(2))
  )

  return {
    category,
    label: PAYMENT_CATEGORY_LABELS[category],
    amountDue,
    previouslyPaid,
    amountCollected,
    lineBalance,
    lineStatus: batchReceiptLineStatus(amountDue, previouslyPaid, amountCollected),
  }
}

export function deriveEntryPaymentStatus(lines: PaymentBatchReceiptLine[]): PaymentStatus {
  if (lines.length === 0) return 'unpaid'
  if (lines.every((line) => line.lineStatus === 'paid')) return 'paid'
  if (lines.some((line) => line.lineStatus === 'partial' || line.amountCollected > 0)) {
    return 'partial'
  }
  return 'unpaid'
}

export { REGISTRATION_DUES_CATEGORIES }

import type { PaymentStatus } from '@/features/entries/types'
import type { PaymentCategory } from '@/features/payments/fee-calc'
import { PAYMENT_CATEGORY_LABELS } from '@/features/payments/schema'
import type { PaymentRefundBatchReceiptLine } from '@/features/payments/types'

export function buildRefundBatchReceiptLine(
  category: PaymentCategory,
  amountDue: number,
  amountCollected: number,
  amountRefunded: number
): PaymentRefundBatchReceiptLine {
  const remainingCollected = Math.max(0, Number((amountCollected - amountRefunded).toFixed(2)))
  const lineBalance = Math.max(0, Number((amountDue - remainingCollected).toFixed(2)))

  let lineStatus: PaymentStatus = 'unpaid'
  if (amountRefunded > 0 && remainingCollected <= 0) {
    lineStatus = 'refunded'
  } else if (remainingCollected <= 0) {
    lineStatus = 'unpaid'
  } else if (lineBalance <= 0) {
    lineStatus = 'paid'
  } else {
    lineStatus = 'partial'
  }

  return {
    category,
    label: PAYMENT_CATEGORY_LABELS[category],
    amountDue,
    amountCollected,
    amountRefunded,
    remainingCollected,
    lineBalance,
    lineStatus,
  }
}

import type { PaymentCategory } from '@/features/payments/fee-calc'
import { REGISTRATION_DUES_CATEGORIES } from '@/features/payments/dues'
import type { PaymentLedgerItem } from '@/features/payments/types'

export type RefundEligibility = {
  refundable: boolean
  reason?: string
}

export function getPaymentRefundEligibility(
  payment: Pick<PaymentLedgerItem, 'paymentCategory' | 'paymentStatus' | 'amountPaid'>
): RefundEligibility {
  if (payment.paymentStatus === 'refunded') {
    return { refundable: false, reason: 'Already refunded' }
  }

  if (payment.amountPaid <= 0) {
    return { refundable: false, reason: 'Nothing collected on this line' }
  }

  if (payment.paymentCategory === 'cash_bond') {
    return {
      refundable: false,
      reason: 'Cash bond refund is available from Outstanding dues after all matches',
    }
  }

  if (payment.paymentCategory === 'match_bet') {
    return { refundable: true }
  }

  if (REGISTRATION_DUES_CATEGORIES.includes(payment.paymentCategory as PaymentCategory)) {
    return { refundable: false, reason: 'Registration fees are non-refundable' }
  }

  return { refundable: false, reason: 'Not refundable' }
}

export function hasRefundablePayments(
  payments: Pick<PaymentLedgerItem, 'paymentCategory' | 'paymentStatus' | 'amountPaid'>[]
): boolean {
  return payments.some((payment) => getPaymentRefundEligibility(payment).refundable)
}

export function getRefundablePayments(
  payments: PaymentLedgerItem[]
): PaymentLedgerItem[] {
  return payments.filter((payment) => getPaymentRefundEligibility(payment).refundable)
}

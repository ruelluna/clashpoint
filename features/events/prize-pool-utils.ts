export function sumPrizePoolFromPayments(
  payments: Array<{ amountPaid: number; paymentCategory: string; paymentStatus: string }>
): number {
  const prizePoolCategories = new Set([
    'registration',
    'rooster_entry',
    'entry_fees',
  ])

  const total = payments.reduce((sum, payment) => {
    if (payment.paymentStatus === 'refunded') return sum
    if (!prizePoolCategories.has(payment.paymentCategory)) {
      return sum
    }
    return sum + payment.amountPaid
  }, 0)

  return Number(total.toFixed(2))
}

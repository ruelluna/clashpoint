export function sumPrizePoolFromPayments(
  payments: Array<{ amountPaid: number; paymentCategory: string; paymentStatus: string }>
): number {
  const total = payments.reduce((sum, payment) => {
    if (payment.paymentStatus === 'refunded') return sum
    if (
      payment.paymentCategory !== 'registration' &&
      payment.paymentCategory !== 'rooster_entry'
    ) {
      return sum
    }
    return sum + payment.amountPaid
  }, 0)

  return Number(total.toFixed(2))
}

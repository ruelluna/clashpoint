import type { PaymentStatus } from '@/features/entries/types'
import type { PaymentCategory } from '@/features/payments/fee-calc'
import { REGISTRATION_DUES_CATEGORIES } from '@/features/payments/dues'
import { hasRefundablePayments } from '@/features/payments/refund-eligibility'
import { PAYMENT_CATEGORY_LABELS } from '@/features/payments/schema'
import type { PaymentLedgerDisplayRow, PaymentLedgerItem } from '@/features/payments/types'

const CATEGORY_ORDER: PaymentCategory[] = [...REGISTRATION_DUES_CATEGORIES]

function roundMoney(value: number): number {
  return Number(value.toFixed(2))
}

function collectedAmountAtPayment(payment: PaymentLedgerItem): number {
  return roundMoney(payment.amountPaid + (payment.refundedAmount ?? 0))
}

function sortByCategory(payments: PaymentLedgerItem[]): PaymentLedgerItem[] {
  return [...payments].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.paymentCategory) - CATEGORY_ORDER.indexOf(b.paymentCategory)
  )
}

function buildCollectionItemLabels(payments: PaymentLedgerItem[]): string[] {
  const labels: string[] = []

  for (const payment of sortByCategory(payments)) {
    if (collectedAmountAtPayment(payment) <= 0) continue
    labels.push(PAYMENT_CATEGORY_LABELS[payment.paymentCategory])
  }

  return labels
}

function buildRefundItemLabels(payments: PaymentLedgerItem[]): string[] {
  const labels: string[] = []

  for (const payment of sortByCategory(payments)) {
    if ((payment.refundedAmount ?? 0) <= 0) continue
    labels.push(`${PAYMENT_CATEGORY_LABELS[payment.paymentCategory]} (refunded)`)
  }

  return labels
}

function deriveHistoricalBatchStatus(payments: PaymentLedgerItem[]): PaymentStatus {
  const collected = payments.filter((payment) => collectedAmountAtPayment(payment) > 0)
  if (collected.length === 0) return 'unpaid'
  return 'paid'
}

function buildCollectionBatchRow(
  batchId: string,
  batchPayments: PaymentLedgerItem[]
): PaymentLedgerDisplayRow {
  const sorted = sortByCategory(batchPayments)
  const primary = sorted[0]

  const amountPaid = roundMoney(
    sorted.reduce((sum, payment) => sum + collectedAmountAtPayment(payment), 0)
  )
  const tenderedPayments = sorted.filter((payment) => payment.amountTendered != null)
  const amountTendered =
    tenderedPayments.length > 0
      ? roundMoney(
          tenderedPayments.reduce((sum, payment) => sum + (payment.amountTendered ?? 0), 0)
        )
      : null
  const changeGiven = sorted.find((payment) => (payment.changeGiven ?? 0) > 0)?.changeGiven ?? 0

  return {
    id: batchId,
    rowKind: 'collection',
    collectionBatchId: batchId,
    refundBatchId: null,
    paymentReference: primary.paymentReference,
    receiptNumber: primary.receiptNumber,
    entryId: primary.entryId,
    entryNumber: primary.entryNumber,
    entryName: primary.entryName,
    ownerName: primary.ownerName,
    amountPaid,
    amountTendered,
    changeGiven: changeGiven > 0 ? changeGiven : null,
    balance: 0,
    paymentStatus: deriveHistoricalBatchStatus(sorted),
    paidAt: primary.paidAt,
    itemsPaid: buildCollectionItemLabels(sorted),
    childPayments: sorted,
    isBatch: true,
  }
}

function buildRefundBatchRow(
  refundBatchId: string,
  refundPayments: PaymentLedgerItem[]
): PaymentLedgerDisplayRow {
  const sorted = sortByCategory(refundPayments)
  const primary = sorted[0]
  const amountRefunded = roundMoney(
    sorted.reduce((sum, payment) => sum + (payment.refundedAmount ?? 0), 0)
  )
  const refundedAt = sorted.reduce((latest, payment) => {
    const candidate = payment.updatedAt || payment.paidAt || payment.createdAt
    if (!candidate) return latest
    if (!latest) return candidate
    return new Date(candidate).getTime() > new Date(latest).getTime() ? candidate : latest
  }, null as string | null)

  return {
    id: `refund-${refundBatchId}`,
    rowKind: 'refund',
    collectionBatchId: null,
    refundBatchId,
    paymentReference: primary.paymentReference,
    receiptNumber: primary.receiptNumber,
    entryId: primary.entryId,
    entryNumber: primary.entryNumber,
    entryName: primary.entryName,
    ownerName: primary.ownerName,
    amountPaid: 0,
    amountRefunded,
    amountTendered: null,
    changeGiven: null,
    balance: 0,
    paymentStatus: 'refunded',
    paidAt: refundedAt,
    itemsPaid: buildRefundItemLabels(sorted),
    childPayments: sorted,
    isBatch: sorted.length > 1,
  }
}

function buildStandaloneCollectionRow(payment: PaymentLedgerItem): PaymentLedgerDisplayRow {
  return {
    id: payment.id,
    rowKind: 'collection',
    collectionBatchId: null,
    refundBatchId: null,
    paymentReference: payment.paymentReference,
    receiptNumber: payment.receiptNumber,
    entryId: payment.entryId,
    entryNumber: payment.entryNumber,
    entryName: payment.entryName,
    ownerName: payment.ownerName,
    amountPaid: collectedAmountAtPayment(payment),
    amountTendered: payment.amountTendered,
    changeGiven: payment.changeGiven,
    balance: 0,
    paymentStatus: 'paid',
    paidAt: payment.paidAt,
    itemsPaid: [PAYMENT_CATEGORY_LABELS[payment.paymentCategory]],
    childPayments: [payment],
    isBatch: false,
  }
}

function rowSortTime(row: PaymentLedgerDisplayRow): number {
  const timestamp = row.paidAt
  return timestamp ? new Date(timestamp).getTime() : 0
}

export { hasRefundablePayments }

export function groupPaymentsForLedger(
  payments: PaymentLedgerItem[]
): PaymentLedgerDisplayRow[] {
  const batchMap = new Map<string, PaymentLedgerItem[]>()
  const refundMap = new Map<string, PaymentLedgerItem[]>()
  const standaloneCollection: PaymentLedgerItem[] = []

  for (const payment of payments) {
    if (payment.refundBatchId) {
      const existing = refundMap.get(payment.refundBatchId) ?? []
      refundMap.set(payment.refundBatchId, [...existing, payment])
    }

    if (payment.collectionBatchId) {
      const existing = batchMap.get(payment.collectionBatchId) ?? []
      batchMap.set(payment.collectionBatchId, [...existing, payment])
      continue
    }

    if (collectedAmountAtPayment(payment) > 0) {
      standaloneCollection.push(payment)
    }
  }

  const collectionRows: PaymentLedgerDisplayRow[] = [
    ...[...batchMap.entries()].map(([batchId, batchPayments]) =>
      buildCollectionBatchRow(batchId, batchPayments)
    ),
    ...standaloneCollection.map((payment) => buildStandaloneCollectionRow(payment)),
  ]

  const refundRows: PaymentLedgerDisplayRow[] = [...refundMap.entries()].map(
    ([refundBatchId, refundPayments]) => buildRefundBatchRow(refundBatchId, refundPayments)
  )

  return [...collectionRows, ...refundRows].sort(
    (a, b) => rowSortTime(b) - rowSortTime(a)
  )
}

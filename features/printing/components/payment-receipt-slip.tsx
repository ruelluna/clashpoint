'use client'

import { Stack, Text } from '@chakra-ui/react'

import { PrintSlipLayout } from '@/features/printing/components/print-slip-layout'
import { PAYMENT_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from '@/features/payments/schema'
import type { PaymentReceiptItem } from '@/features/payments/types'
import { formatEventDateTime } from '@/lib/format/datetime'

type PaymentReceiptSlipProps = {
  payment: PaymentReceiptItem
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

export function PaymentReceiptSlip({ payment }: PaymentReceiptSlipProps) {
  const methodLabel =
    payment.paymentMethod &&
    payment.paymentMethod in PAYMENT_METHOD_LABELS
      ? PAYMENT_METHOD_LABELS[
          payment.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS
        ]
      : payment.paymentMethod ?? '—'

  const paidAtLabel = payment.paidAt ?? payment.createdAt

  return (
    <PrintSlipLayout title="Payment receipt" eventName={payment.eventName}>
      <Stack gap={2}>
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Reference:{' '}
          </Text>
          {payment.paymentReference}
        </Text>
        {payment.cashierName ? (
          <Text fontSize="sm">
            <Text as="span" color="fg.muted">
              Cashier:{' '}
            </Text>
            {payment.cashierName}
          </Text>
        ) : null}
        {payment.sessionOpenedAt ? (
          <Text fontSize="sm">
            <Text as="span" color="fg.muted">
              Session opened:{' '}
            </Text>
            {formatEventDateTime(payment.sessionOpenedAt)}
          </Text>
        ) : null}
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Entry:{' '}
          </Text>
          #{payment.entryNumber} {payment.entryName}
        </Text>
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Owner:{' '}
          </Text>
          {payment.ownerName}
        </Text>
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Category:{' '}
          </Text>
          {PAYMENT_CATEGORY_LABELS[payment.paymentCategory]}
        </Text>
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Amount due:{' '}
          </Text>
          {formatCurrency(payment.amountDue)}
        </Text>
        <Text fontSize="lg" fontWeight="bold">
          Paid: {formatCurrency(payment.amountPaid)}
        </Text>
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Balance:{' '}
          </Text>
          {formatCurrency(payment.balance)}
        </Text>
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Method:{' '}
          </Text>
          {methodLabel}
        </Text>
        {payment.receiptNumber ? (
          <Text fontSize="sm">
            <Text as="span" color="fg.muted">
              Receipt #:{' '}
            </Text>
            {payment.receiptNumber}
          </Text>
        ) : null}
        <Text fontSize="xs" color="fg.muted">
          {formatEventDateTime(paidAtLabel)} (Philippines)
        </Text>
      </Stack>
    </PrintSlipLayout>
  )
}

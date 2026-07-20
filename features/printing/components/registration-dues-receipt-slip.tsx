'use client'

import { Box, Stack, Text } from '@chakra-ui/react'

import { PAYMENT_STATUS_LABELS } from '@/features/entries/schema'
import { PrintSlipLayout } from '@/features/printing/components/print-slip-layout'
import { PAYMENT_METHOD_LABELS } from '@/features/payments/schema'
import type { PaymentBatchReceiptItem } from '@/features/payments/types'
import { formatEventDateTime } from '@/lib/format/datetime'

type RegistrationDuesReceiptSlipProps = {
  receipt: PaymentBatchReceiptItem
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

function formatAmount(value: number) {
  return value > 0 ? formatCurrency(value) : '—'
}

export function RegistrationDuesReceiptSlip({ receipt }: RegistrationDuesReceiptSlipProps) {
  const methodLabel =
    receipt.paymentMethod && receipt.paymentMethod in PAYMENT_METHOD_LABELS
      ? PAYMENT_METHOD_LABELS[
          receipt.paymentMethod as keyof typeof PAYMENT_METHOD_LABELS
        ]
      : receipt.paymentMethod ?? '—'

  return (
    <PrintSlipLayout title="Payment receipt" eventName={receipt.eventName}>
      <Stack gap={3}>
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Reference:{' '}
          </Text>
          {receipt.paymentReference}
        </Text>
        {receipt.cashierName ? (
          <Text fontSize="sm">
            <Text as="span" color="fg.muted">
              Cashier:{' '}
            </Text>
            {receipt.cashierName}
          </Text>
        ) : null}
        {receipt.sessionOpenedAt ? (
          <Text fontSize="sm">
            <Text as="span" color="fg.muted">
              Session opened:{' '}
            </Text>
            {formatEventDateTime(receipt.sessionOpenedAt)}
          </Text>
        ) : null}
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Entry:{' '}
          </Text>
          #{receipt.entryNumber} {receipt.entryName}
        </Text>
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Owner:{' '}
          </Text>
          {receipt.ownerName}
        </Text>

        {receipt.isFollowUpCollect && receipt.priorReceiptReference ? (
          <Text fontSize="xs" color="fg.muted">
            Previous receipt {receipt.priorReceiptReference}
            {receipt.priorReceiptCollected != null
              ? ` collected ${formatCurrency(receipt.priorReceiptCollected)}.`
              : '.'}{' '}
            Amounts below include prior payments and this collection.
          </Text>
        ) : null}

        <Box overflowX="auto" className="registration-dues-receipt-table">
          <Box
            as="table"
            width="100%"
            fontSize="xs"
            css={{
              borderCollapse: 'collapse',
              '& th, & td': {
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--chakra-colors-border)',
                padding: '4px 6px',
                verticalAlign: 'top',
              },
              '& th': {
                textAlign: 'left',
                fontWeight: 'semibold',
              },
              '& td.amount': {
                textAlign: 'right',
                whiteSpace: 'nowrap',
              },
            }}
          >
            <Box as="thead">
              <Box as="tr">
                <Box as="th">Item</Box>
                <Box as="th">Due</Box>
                <Box as="th">Prev. paid</Box>
                <Box as="th">Collected</Box>
                <Box as="th">Balance</Box>
                <Box as="th">Status</Box>
              </Box>
            </Box>
            <Box as="tbody">
              {receipt.lines.map((line) => (
                <Box as="tr" key={line.category}>
                  <Box as="td">{line.label}</Box>
                  <Box as="td" className="amount">
                    {formatCurrency(line.amountDue)}
                  </Box>
                  <Box as="td" className="amount">
                    {formatAmount(line.previouslyPaid)}
                  </Box>
                  <Box as="td" className="amount">
                    {formatAmount(line.amountCollected)}
                  </Box>
                  <Box as="td" className="amount">
                    {line.lineBalance > 0 ? formatCurrency(line.lineBalance) : '—'}
                  </Box>
                  <Box as="td">{PAYMENT_STATUS_LABELS[line.lineStatus]}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Text fontSize="lg" fontWeight="bold">
          Total collected: {formatCurrency(receipt.totalCollected)}
        </Text>
        {receipt.paymentMethod === 'cash' && receipt.amountTendered != null ? (
          <>
            <Text fontSize="sm">
              <Text as="span" color="fg.muted">
                Cash tendered:{' '}
              </Text>
              {formatCurrency(receipt.amountTendered)}
            </Text>
            <Text fontSize="sm" fontWeight="semibold">
              Change: {formatCurrency(receipt.changeGiven ?? 0)}
            </Text>
          </>
        ) : null}

        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Overall status:{' '}
          </Text>
          {PAYMENT_STATUS_LABELS[receipt.entryPaymentStatus]}
        </Text>
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Method:{' '}
          </Text>
          {methodLabel}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {formatEventDateTime(receipt.paidAt)} (Philippines)
        </Text>
      </Stack>
    </PrintSlipLayout>
  )
}

'use client'

import { Box, Stack, Text } from '@chakra-ui/react'

import { PAYMENT_STATUS_LABELS } from '@/features/entries/schema'
import { PrintSlipLayout } from '@/features/printing/components/print-slip-layout'
import type { PaymentRefundBatchReceiptItem } from '@/features/payments/types'
import { formatEventDateTime } from '@/lib/format/datetime'

type RegistrationDuesRefundSlipProps = {
  receipt: PaymentRefundBatchReceiptItem
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

export function RegistrationDuesRefundSlip({ receipt }: RegistrationDuesRefundSlipProps) {
  return (
    <PrintSlipLayout title="Refund receipt" eventName={receipt.eventName}>
      <Stack gap={3}>
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Refund reference:{' '}
          </Text>
          {receipt.refundReference}
        </Text>
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Original receipt:{' '}
          </Text>
          {receipt.originalReceiptReference}
        </Text>
        {receipt.cashierName ? (
          <Text fontSize="sm">
            <Text as="span" color="fg.muted">
              Cashier:{' '}
            </Text>
            {receipt.cashierName}
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
        <Text fontSize="sm">
          <Text as="span" color="fg.muted">
            Reason:{' '}
          </Text>
          {receipt.reason}
        </Text>

        <Box overflowX="auto" className="registration-dues-refund-table">
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
                <Box as="th">Collected</Box>
                <Box as="th">Refunded</Box>
                <Box as="th">Remaining</Box>
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
                    {formatAmount(line.amountCollected)}
                  </Box>
                  <Box as="td" className="amount">
                    {formatAmount(line.amountRefunded)}
                  </Box>
                  <Box as="td" className="amount">
                    {formatAmount(line.remainingCollected)}
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
          Total refunded: {formatCurrency(receipt.totalRefunded)}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          {formatEventDateTime(receipt.refundedAt)} (Philippines)
        </Text>
      </Stack>
    </PrintSlipLayout>
  )
}

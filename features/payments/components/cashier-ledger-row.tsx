'use client'

import { Badge, Box, Button, Flex, Link, Stack, Text } from '@chakra-ui/react'

import { PAYMENT_STATUS_LABELS } from '@/features/entries/schema'
import type { PaymentLedgerDisplayRow } from '@/features/payments/types'

type CashierLedgerRowProps = {
  eventId: string
  row: PaymentLedgerDisplayRow
  formatCurrency: (amount: number) => string
  formatDate: (iso: string | null) => string
  paymentStatusColor: (
    status: PaymentLedgerDisplayRow['paymentStatus']
  ) => 'gray' | 'yellow' | 'green' | 'orange'
}

function collectionPrintHref(eventId: string, row: PaymentLedgerDisplayRow): string {
  return row.isBatch && row.collectionBatchId
    ? `/dashboard/events/${eventId}/payments/batch/${row.collectionBatchId}/print`
    : `/dashboard/events/${eventId}/payments/${row.childPayments[0]?.id}/print`
}

function refundPrintHref(eventId: string, row: PaymentLedgerDisplayRow): string | null {
  if (!row.refundBatchId) return null
  return `/dashboard/events/${eventId}/payments/refund-batch/${row.refundBatchId}/print`
}

export function CashierLedgerRow({
  eventId,
  row,
  formatCurrency,
  formatDate,
  paymentStatusColor,
}: CashierLedgerRowProps) {
  const isRefund = row.rowKind === 'refund'
  const collectionHref = collectionPrintHref(eventId, row)
  const refundHref = refundPrintHref(eventId, row)
  const showBalance = !isRefund && row.balance > 0

  return (
    <Box
      px={4}
      py={{ base: 3, lg: 4 }}
      borderBottomWidth="1px"
      borderColor="border"
      data-testid="cashier-ledger-row"
    >
      <Box display={{ base: 'block', lg: 'none' }}>
        <Box borderWidth="1px" borderColor="border" borderRadius="md" p={4}>
          <Flex justify="space-between" align="flex-start" gap={3} mb={2}>
            <Box minW={0}>
              <Text fontWeight="semibold" fontSize="sm">
                {row.paymentReference}
              </Text>
              {row.receiptNumber ? (
                <Text fontSize="xs" color="fg.muted">
                  Receipt {row.receiptNumber}
                </Text>
              ) : null}
            </Box>
            <Badge flexShrink={0} colorPalette={paymentStatusColor(row.paymentStatus)}>
              {PAYMENT_STATUS_LABELS[row.paymentStatus]}
            </Badge>
          </Flex>

          <Text
            fontSize="xl"
            fontWeight="semibold"
            color={isRefund ? 'orange.600' : undefined}
          >
            {isRefund ? '−' : ''}
            {formatCurrency(isRefund ? row.amountRefunded ?? 0 : row.amountPaid)}
          </Text>

          {!isRefund && row.amountTendered != null && row.changeGiven != null ? (
            <Text fontSize="xs" color="fg.muted" mt={1}>
              Tender {formatCurrency(row.amountTendered)} · Change{' '}
              {formatCurrency(row.changeGiven)}
            </Text>
          ) : null}

          <Text fontSize="sm" mt={3}>
            #{row.entryNumber} {row.entryName}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {row.ownerName}
          </Text>

          {row.itemsPaid.length > 0 ? (
            <Text fontSize="xs" color="fg.muted" mt={2}>
              {row.itemsPaid.join(' · ')}
            </Text>
          ) : null}

          <Text fontSize="xs" color="fg.muted" mt={2}>
            {formatDate(row.paidAt)}
          </Text>

          {showBalance ? (
            <Text fontSize="xs" color="fg.muted" mt={1}>
              Balance {formatCurrency(row.balance)}
            </Text>
          ) : null}

          {row.rowKind === 'collection' ? (
            <Button asChild size="md" variant="outline" w="full" mt={4}>
              <Link href={collectionHref} data-testid="cashier-ledger-print-link">
                Print receipt
              </Link>
            </Button>
          ) : null}
          {isRefund && refundHref ? (
            <Button asChild size="md" variant="outline" w="full" mt={4}>
              <Link href={refundHref} data-testid="cashier-ledger-print-link">
                Print refund receipt
              </Link>
            </Button>
          ) : null}
        </Box>
      </Box>

      <Flex
        display={{ base: 'none', lg: 'flex' }}
        gap={3}
        align="center"
      >
        <Box flex="1">
          <Text fontWeight="medium" fontSize="sm">
            {row.paymentReference}
          </Text>
          {row.receiptNumber ? (
            <Text fontSize="xs" color="fg.muted">
              Receipt {row.receiptNumber}
            </Text>
          ) : null}
        </Box>
        <Box flex="1.2">
          <Stack gap={0.5}>
            {row.itemsPaid.map((item) => (
              <Text key={item} fontSize="xs">
                {item}
              </Text>
            ))}
          </Stack>
        </Box>
        <Box flex="1.2">
          <Text fontSize="sm">
            #{row.entryNumber} {row.entryName}
          </Text>
          <Text fontSize="xs" color="fg.muted">
            {row.ownerName}
          </Text>
        </Box>
        <Box flex="0.7">
          {isRefund ? (
            <Text fontSize="sm" color="orange.600">
              −{formatCurrency(row.amountRefunded ?? 0)}
            </Text>
          ) : (
            <>
              <Text fontSize="sm">{formatCurrency(row.amountPaid)}</Text>
              {row.amountTendered != null && row.changeGiven != null ? (
                <Text fontSize="xs" color="fg.muted">
                  Tender {formatCurrency(row.amountTendered)} · Change{' '}
                  {formatCurrency(row.changeGiven)}
                </Text>
              ) : null}
            </>
          )}
        </Box>
        <Box flex="0.7">
          <Text fontSize="sm">{isRefund ? '—' : formatCurrency(row.balance)}</Text>
        </Box>
        <Box flex="0.7">
          <Badge colorPalette={paymentStatusColor(row.paymentStatus)}>
            {PAYMENT_STATUS_LABELS[row.paymentStatus]}
          </Badge>
        </Box>
        <Box flex="1">
          <Text fontSize="sm">{formatDate(row.paidAt)}</Text>
          {row.rowKind === 'collection' ? (
            <Link
              href={collectionHref}
              fontSize="xs"
              color="blue.600"
              data-testid="cashier-ledger-print-link"
            >
              Print receipt
            </Link>
          ) : null}
          {isRefund && refundHref ? (
            <Link
              href={refundHref}
              fontSize="xs"
              color="blue.600"
              display="block"
              data-testid="cashier-ledger-print-link"
            >
              Print refund receipt
            </Link>
          ) : null}
        </Box>
      </Flex>
    </Box>
  )
}

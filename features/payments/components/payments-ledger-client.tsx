'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  NativeSelect,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useActionState, useMemo, useState } from 'react'

import {
  PAYMENT_STATUS_LABELS,
} from '@/features/entries/schema'
import type { EntryListItem } from '@/features/entries/types'
import {
  recordPaymentAction,
  refundPaymentAction,
  type PaymentActionState,
} from '@/features/payments/actions'
import { PAYMENT_METHOD_LABELS } from '@/features/payments/schema'
import type { PaymentLedgerItem } from '@/features/payments/types'

type PaymentsLedgerClientProps = {
  eventId: string
  eventName: string
  entryFee: number
  entries: EntryListItem[]
  payments: PaymentLedgerItem[]
}

const initialState: PaymentActionState = {}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function paymentStatusColor(
  status: PaymentLedgerItem['paymentStatus']
): 'gray' | 'yellow' | 'green' | 'orange' {
  switch (status) {
    case 'unpaid':
      return 'gray'
    case 'partial':
      return 'yellow'
    case 'paid':
      return 'green'
    case 'refunded':
      return 'orange'
    default:
      return 'gray'
  }
}

function RefundForm({
  payment,
  eventId,
}: {
  payment: PaymentLedgerItem
  eventId: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [state, action, pending] = useActionState(refundPaymentAction, initialState)

  if (payment.paymentStatus === 'refunded') return null

  return (
    <Box mt={2}>
      {!showForm ? (
        <Button size="xs" variant="outline" onClick={() => setShowForm(true)}>
          Refund
        </Button>
      ) : (
        <form action={action}>
          <input type="hidden" name="paymentId" value={payment.id} />
          <input type="hidden" name="eventId" value={eventId} />
          <Textarea
            name="reason"
            placeholder="Reason for refund"
            rows={2}
            size="sm"
            required
            minLength={3}
          />
          <Flex gap={2} mt={2}>
            <Button size="xs" type="submit" colorPalette="red" loading={pending}>
              Confirm refund
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </Flex>
          {state.error ? (
            <Text fontSize="xs" color="red.500" mt={1}>
              {state.error}
            </Text>
          ) : null}
          {state.success ? (
            <Text fontSize="xs" color="green.600" mt={1}>
              {state.success}
            </Text>
          ) : null}
        </form>
      )}
    </Box>
  )
}

export function PaymentsLedgerClient({
  eventId,
  eventName,
  entryFee,
  entries,
  payments,
}: PaymentsLedgerClientProps) {
  const [recordState, recordAction, recordPending] = useActionState(
    recordPaymentAction,
    initialState
  )
  const [selectedEntryId, setSelectedEntryId] = useState('')

  const payableEntries = useMemo(
    () => entries.filter((entry) => entry.payment_status !== 'paid'),
    [entries]
  )

  return (
    <Flex direction="column" gap={8}>
      <Box>
        <Text fontSize="lg" fontWeight="semibold">
          Payments
        </Text>
        <Text color="fg.muted" fontSize="sm">
          {eventName} · Entry fee {formatCurrency(entryFee)}
        </Text>
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="lg" p={6}>
        <Text fontWeight="medium" mb={5}>
          Record payment
        </Text>
        <form action={recordAction} className="flex max-w-xl flex-col gap-5">
          <input type="hidden" name="eventId" value={eventId} />

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Entry
            </Text>
            <NativeSelect.Root>
              <NativeSelect.Field
                name="entryId"
                value={selectedEntryId}
                onChange={(event) => setSelectedEntryId(event.currentTarget.value)}
              >
                <option value="">Select entry</option>
                {payableEntries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    #{entry.entry_number} {entry.entry_name} ·{' '}
                    {PAYMENT_STATUS_LABELS[entry.payment_status]}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>

          <Flex gap={4} direction={{ base: 'column', sm: 'row' }}>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Amount paid
              </Text>
              <Input
                name="amountPaid"
                type="number"
                min="0.01"
                step="0.01"
                required
                defaultValue={entryFee}
              />
            </Box>
            <Box flex="1">
              <Text fontSize="sm" fontWeight="medium" mb={2}>
                Payment method
              </Text>
              <NativeSelect.Root>
                <NativeSelect.Field name="paymentMethod" defaultValue="cash">
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Box>
          </Flex>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Receipt number
            </Text>
            <Input name="receiptNumber" maxLength={100} />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Notes
            </Text>
            <Textarea name="notes" rows={2} maxLength={2000} />
          </Box>

          {recordState.error ? (
            <Text fontSize="sm" color="red.500">
              {recordState.error}
            </Text>
          ) : null}
          {recordState.success ? (
            <Text fontSize="sm" color="green.600">
              {recordState.success}
            </Text>
          ) : null}

          <Button type="submit" loading={recordPending} disabled={!payableEntries.length}>
            Record payment
          </Button>
        </form>
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        <Flex
          px={4}
          py={4}
          borderBottomWidth="1px"
          borderColor="border"
          fontWeight="medium"
          fontSize="sm"
          display={{ base: 'none', lg: 'flex' }}
        >
          <Box flex="1.2">Reference</Box>
          <Box flex="1.2">Entry</Box>
          <Box flex="0.8">Paid</Box>
          <Box flex="0.8">Balance</Box>
          <Box flex="0.8">Status</Box>
          <Box flex="1">Paid at</Box>
        </Flex>

        {payments.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">No payments recorded yet.</Text>
          </Box>
        ) : (
          payments.map((payment) => (
            <Box
              key={payment.id}
              px={4}
              py={4}
              borderBottomWidth="1px"
              borderColor="border"
            >
              <Flex
                direction={{ base: 'column', lg: 'row' }}
                gap={3}
                align={{ lg: 'center' }}
              >
                <Box flex="1.2">
                  <Text fontWeight="medium" fontSize="sm">
                    {payment.paymentReference}
                  </Text>
                  {payment.receiptNumber ? (
                    <Text fontSize="xs" color="fg.muted">
                      Receipt {payment.receiptNumber}
                    </Text>
                  ) : null}
                </Box>
                <Box flex="1.2">
                  <Text fontSize="sm">
                    #{payment.entryNumber} {payment.entryName}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {payment.ownerName}
                  </Text>
                </Box>
                <Box flex="0.8">
                  <Text fontSize="sm">{formatCurrency(payment.amountPaid)}</Text>
                </Box>
                <Box flex="0.8">
                  <Text fontSize="sm">{formatCurrency(payment.balance)}</Text>
                </Box>
                <Box flex="0.8">
                  <Badge colorPalette={paymentStatusColor(payment.paymentStatus)}>
                    {PAYMENT_STATUS_LABELS[payment.paymentStatus]}
                  </Badge>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm">{formatDate(payment.paidAt)}</Text>
                </Box>
              </Flex>
              <RefundForm payment={payment} eventId={eventId} />
            </Box>
          ))
        )}
      </Box>

      <Box borderWidth="1px" borderColor="border" rounded="lg" p={6}>
        <Text fontWeight="medium" mb={5}>
          Entry payment summary
        </Text>
        <Flex direction="column" gap={4}>
          {entries.map((entry) => (
            <Flex key={entry.id} justify="space-between" gap={3} fontSize="sm">
              <Text>
                #{entry.entry_number} {entry.entry_name}
              </Text>
              <Flex gap={2}>
                <Badge colorPalette={paymentStatusColor(entry.payment_status)}>
                  {PAYMENT_STATUS_LABELS[entry.payment_status]}
                </Badge>
              </Flex>
            </Flex>
          ))}
        </Flex>
      </Box>
    </Flex>
  )
}

'use client'

import {
  Badge,
  Box,
  Button,
  Flex,
  Input,
  Link,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { useActionState, useMemo, useState } from 'react'

import { ButtonGroup, FormField, LAYOUT_GAP, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import {
  getOwnerRegistrationPaymentDisplay,
  isOwnerRegistrationPaymentRequired,
} from '@/features/payments/display-utils'
import type { EntryListItem } from '@/features/entries/types'
import { PAYMENT_STATUS_LABELS } from '@/features/entries/schema'
import type { EventFeeSettings } from '@/features/events/fee-utils'
import {
  computeCategoryAmountDue,
} from '@/features/payments/fee-calc'
import {
  recordPaymentAction,
  refundPaymentAction,
  type PaymentActionState,
} from '@/features/payments/actions'
import { PAYMENT_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from '@/features/payments/schema'
import type { PaymentLedgerItem } from '@/features/payments/types'
import type { PaymentCategory } from '@/features/payments/fee-calc'

type PaymentsLedgerClientProps = {
  eventId: string
  eventName: string
  feeSettings: EventFeeSettings
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
          <ButtonGroup mt={2}>
            <Button size="xs" type="submit" colorPalette="red" loading={pending}>
              Confirm refund
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </ButtonGroup>
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

function resolveEntryFeeSettingsForEntry(
  entry: EntryListItem,
  eventSettings: EventFeeSettings
): EventFeeSettings {
  if (entry.fee_snapshot != null) {
    return entry.fee_snapshot as unknown as EventFeeSettings
  }
  return eventSettings
}

export function PaymentsLedgerClient({
  eventId,
  eventName,
  feeSettings,
  entries,
  payments,
}: PaymentsLedgerClientProps) {
  const [recordState, recordAction, recordPending] = useActionState(
    recordPaymentAction,
    initialState
  )
  const [selectedEntryId, setSelectedEntryId] = useState('')
  const [paymentCategory, setPaymentCategory] = useState<PaymentCategory>('rooster_entry')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId),
    [entries, selectedEntryId]
  )

  const roosterCount = selectedEntry?.rooster_count ?? 0

  const suggestedAmount = useMemo(() => {
    return computeCategoryAmountDue(paymentCategory, feeSettings, roosterCount)
  }, [feeSettings, paymentCategory, roosterCount])

  const feeSummary = useMemo(() => {
    const parts: string[] = []
    if (feeSettings.registrationFeeEnabled) {
      parts.push(`Registration ${formatCurrency(feeSettings.registrationFeeAmount)}`)
    }
    if (feeSettings.roosterEntryFeeEnabled) {
      parts.push(
        `Entry ${formatCurrency(feeSettings.roosterEntryFeeAmount)} / cock`
      )
    }
    if (feeSettings.cashBondEnabled) {
      parts.push(`Bond ${formatCurrency(feeSettings.cashBondAmount)}`)
    }
    return parts.length ? parts.join(' · ') : 'No fees configured'
  }, [feeSettings])

  const payableEntries = useMemo(
    () =>
      entries.filter((entry) => {
        const settings = resolveEntryFeeSettingsForEntry(entry, feeSettings)
        const hasAnyFee =
          settings.registrationFeeEnabled ||
          settings.roosterEntryFeeEnabled ||
          settings.cashBondEnabled
        if (!hasAnyFee) return false
        if (
          !isOwnerRegistrationPaymentRequired(settings) &&
          entry.payment_status === 'unpaid'
        ) {
          return settings.roosterEntryFeeEnabled || settings.cashBondEnabled
        }
        return entry.payment_status !== 'paid'
      }),
    [entries, feeSettings]
  )

  return (
    <PageStack>
      <PageHeader
        title="Payments"
        description={`${eventName} · ${feeSummary}`}
      />

      <PanelCard title="Record payment">
        <form action={recordAction}>
          <Stack gap={LAYOUT_GAP.form} maxW="xl">
          <input type="hidden" name="eventId" value={eventId} />

          <FormField label="Entry" required>
            <NativeSelect.Root>
              <NativeSelect.Field
                name="entryId"
                value={selectedEntryId}
                onChange={(event) => setSelectedEntryId(event.currentTarget.value)}
              >
                <option value="">Select entry</option>
                {payableEntries.map((entry) => {
                  const settings = resolveEntryFeeSettingsForEntry(entry, feeSettings)
                  const paymentDisplay = getOwnerRegistrationPaymentDisplay(
                    entry.payment_status,
                    settings
                  )
                  return (
                    <option key={entry.id} value={entry.id}>
                      #{entry.entry_number} {entry.entry_name}
                      {paymentDisplay ? ` · ${paymentDisplay.label}` : ''}
                    </option>
                  )
                })}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </FormField>

          <FormField label="Payment category" required>
            <NativeSelect.Root>
              <NativeSelect.Field
                name="paymentCategory"
                value={paymentCategory}
                onChange={(event) =>
                  setPaymentCategory(event.currentTarget.value as PaymentCategory)
                }
              >
                {feeSettings.registrationFeeEnabled ? (
                  <option value="registration">Registration fee</option>
                ) : null}
                {feeSettings.roosterEntryFeeEnabled ? (
                  <option value="rooster_entry">Rooster entry fee</option>
                ) : null}
                {feeSettings.cashBondEnabled ? (
                  <option value="cash_bond">Cash bond</option>
                ) : null}
                <option value="legacy">Combined (legacy)</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
          </FormField>

          <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', sm: 'row' }}>
            <FormField label="Amount paid" required flex="1">
              <Input
                name="amountPaid"
                type="number"
                min="0.01"
                step="0.01"
                required
                key={`${selectedEntryId}-${paymentCategory}`}
                defaultValue={suggestedAmount || undefined}
              />
            </FormField>
            <FormField label="Payment method" flex="1">
              <NativeSelect.Root>
                <NativeSelect.Field
                    name="paymentMethod"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.currentTarget.value)}
                  >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </FormField>
          </Flex>

          {paymentMethod !== 'cash' && (
            <FormField label="Receipt number" required>
              <Input name="receiptNumber" maxLength={100} required />
            </FormField>
          )}

          <FormField label="Notes">
            <Textarea name="notes" rows={2} maxLength={2000} />
          </FormField>

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

          <Button type="submit" loading={recordPending} disabled={!payableEntries.length} alignSelf="flex-start">
            Record payment
          </Button>
          </Stack>
        </form>
      </PanelCard>

      <PanelCard flush>
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
                  <Text fontSize="xs" color="fg.muted">
                    {PAYMENT_CATEGORY_LABELS[payment.paymentCategory]}
                  </Text>
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
                  <Link
                    href={`/dashboard/events/${eventId}/payments/${payment.id}/print`}
                    fontSize="xs"
                    color="blue.600"
                  >
                    Print receipt
                  </Link>
                </Box>
              </Flex>
              <RefundForm payment={payment} eventId={eventId} />
            </Box>
          ))
        )}
      </PanelCard>

      <PanelCard title="Entry payment summary">
        <Stack gap={LAYOUT_GAP.form}>
          {entries.map((entry) => {
            const settings = resolveEntryFeeSettingsForEntry(entry, feeSettings)
            const paymentDisplay = getOwnerRegistrationPaymentDisplay(
              entry.payment_status,
              settings
            )
            return (
              <Flex key={entry.id} justify="space-between" gap={3} fontSize="sm">
                <Text>
                  #{entry.entry_number} {entry.entry_name}
                </Text>
                {paymentDisplay ? (
                  <Badge colorPalette={paymentDisplay.colorPalette}>
                    {paymentDisplay.label}
                  </Badge>
                ) : null}
              </Flex>
            )
          })}
        </Stack>
      </PanelCard>
    </PageStack>
  )
}

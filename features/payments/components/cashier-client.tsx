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
import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  ButtonGroup,
  FormField,
  LAYOUT_GAP,
  PageHeader,
  PageStack,
  PanelCard,
} from '@/components/dashboard'
import { OwnerBarcodeScannerDialog } from '@/features/entries/components/owner-barcode-scanner-dialog'
import type { EntryListItem } from '@/features/entries/types'
import { PAYMENT_STATUS_LABELS } from '@/features/entries/schema'
import type { EventFeeSettings } from '@/features/events/fee-utils'
import type { PaymentCategory } from '@/features/payments/fee-calc'
import {
  getCashierDuesAction,
  lookupCashierTargetAction,
  recordPaymentAction,
  refundPaymentAction,
  type PaymentActionState,
} from '@/features/payments/actions'
import { PAYMENT_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from '@/features/payments/schema'
import type { CashierTargetMatch, PaymentLedgerItem } from '@/features/payments/types'

type CashierClientProps = {
  eventId: string
  eventName: string
  feeSettings: EventFeeSettings
  entries: EntryListItem[]
  payments: PaymentLedgerItem[]
  revolvingFundBalance: number
  initialBarcode?: string | null
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

export function CashierClient({
  eventId,
  eventName,
  feeSettings,
  entries,
  payments,
  revolvingFundBalance,
  initialBarcode,
}: CashierClientProps) {
  const scanInputRef = useRef<HTMLInputElement>(null)
  const [scanValue, setScanValue] = useState('')
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanPending, setScanPending] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [matches, setMatches] = useState<CashierTargetMatch[]>([])
  const [activeMatch, setActiveMatch] = useState<CashierTargetMatch | null>(null)

  const [recordState, recordAction, recordPending] = useActionState(
    recordPaymentAction,
    initialState
  )
  const [paymentCategory, setPaymentCategory] = useState<PaymentCategory>('registration')
  const [paymentMethod, setPaymentMethod] = useState<
    keyof typeof PAYMENT_METHOD_LABELS
  >('cash')

  const applyMatch = useCallback((match: CashierTargetMatch) => {
    setActiveMatch(match)
    setMatches([])
    setScanError(null)
    const suggested = match.dues.suggestedCategory
    if (suggested) setPaymentCategory(suggested)
  }, [])

  const resolveQuery = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim()
      if (!trimmed) {
        setScanError('Enter a barcode or search for an owner / entry')
        return
      }

      setScanPending(true)
      setScanError(null)
      setMatches([])

      const result = await lookupCashierTargetAction(eventId, trimmed)
      setScanPending(false)

      if (result.error) {
        setScanError(result.error)
        setActiveMatch(null)
        scanInputRef.current?.select()
        return
      }

      const found = result.matches ?? []
      if (found.length === 1) {
        applyMatch(found[0])
        setScanValue('')
        return
      }

      setActiveMatch(null)
      setMatches(found)
    },
    [applyMatch, eventId]
  )

  useEffect(() => {
    if (!initialBarcode?.trim()) return
    void resolveQuery(initialBarcode)
  }, [initialBarcode, resolveQuery])

  const suggestedAmount = useMemo(() => {
    if (!activeMatch) return 0
    const line = activeMatch.dues.lines.find((item) => item.category === paymentCategory)
    if (line) return line.outstanding
    return activeMatch.dues.suggestedAmount
  }, [activeMatch, paymentCategory])

  const feeSummary = useMemo(() => {
    const parts: string[] = []
    if (feeSettings.registrationFeeEnabled) {
      parts.push(`Registration ${formatCurrency(feeSettings.registrationFeeAmount)}`)
    }
    if (feeSettings.roosterEntryFeeEnabled) {
      parts.push(`Entry ${formatCurrency(feeSettings.roosterEntryFeeAmount)} / cock`)
    }
    if (feeSettings.cashBondEnabled) {
      parts.push(`Bond ${formatCurrency(feeSettings.cashBondAmount)}`)
    }
    return parts.length ? parts.join(' · ') : 'No fees configured'
  }, [feeSettings])

  async function handleScanKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    await resolveQuery(scanValue)
  }

  async function selectEntryFromDropdown(entryId: string) {
    if (!entryId) {
      setActiveMatch(null)
      return
    }
    setScanPending(true)
    setScanError(null)
    const result = await getCashierDuesAction(eventId, entryId)
    setScanPending(false)
    if (result.error || !result.match) {
      setScanError(result.error ?? 'Could not load dues for this entry')
      return
    }
    applyMatch(result.match)
  }

  return (
    <PageStack>
      <PageHeader
        title="Cashier"
        description={`${eventName} · ${feeSummary}`}
        actions={
          <Box textAlign={{ base: 'left', sm: 'right' }}>
            <Text fontSize="sm" color="fg.muted">
              Revolving fund
            </Text>
            <Text fontSize="xl" fontWeight="semibold" data-testid="cashier-fund-balance">
              {formatCurrency(revolvingFundBalance)}
            </Text>
          </Box>
        }
      />

      <PanelCard title="Scan or search">
        <Stack gap={LAYOUT_GAP.form}>
          <Flex direction="column" gap={2} maxW="2xl">
            <Input
              ref={scanInputRef}
              size="md"
              placeholder="Scan OWN-/COCK- barcode, or search owner / entry #"
              value={scanValue}
              onChange={(event) => {
                setScanValue(event.target.value)
                if (scanError) setScanError(null)
              }}
              onKeyDown={handleScanKeyDown}
              disabled={scanPending}
              data-testid="cashier-scan-input"
            />
            <Flex gap={2} wrap="wrap">
              <Button
                size="md"
                variant="outline"
                onClick={() => setScannerOpen(true)}
                disabled={scanPending}
              >
                Scan with camera
              </Button>
              <Button
                size="md"
                onClick={() => void resolveQuery(scanValue)}
                loading={scanPending}
                disabled={!scanValue.trim()}
              >
                Look up
              </Button>
            </Flex>
          </Flex>

          <Box maxW="2xl">
            <FormField label="Or select entry">
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={activeMatch?.entryId ?? ''}
                  onChange={(event) => void selectEntryFromDropdown(event.currentTarget.value)}
                  data-testid="cashier-entry-select"
                >
                  <option value="">Select entry</option>
                  {entries.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      #{entry.entry_number} {entry.entry_name} · {entry.owner_name}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
            </FormField>
          </Box>

          {scanError ? (
            <Text fontSize="sm" color="red.500">
              {scanError}
            </Text>
          ) : null}

          {matches.length > 1 ? (
            <Stack gap={2}>
              <Text fontSize="sm" color="fg.muted">
                Multiple matches — choose one:
              </Text>
              {matches.map((match) => (
                <Button
                  key={match.entryId}
                  variant="outline"
                  justifyContent="flex-start"
                  onClick={() => applyMatch(match)}
                >
                  #{match.entryNumber} {match.entryName} · {match.ownerName} ·{' '}
                  {formatCurrency(match.dues.totalOutstanding)} due
                </Button>
              ))}
            </Stack>
          ) : null}
        </Stack>
      </PanelCard>

      {activeMatch ? (
        <PanelCard title="Outstanding dues">
          <Stack gap={LAYOUT_GAP.form}>
            <Box>
              <Text fontWeight="medium">
                #{activeMatch.entryNumber} {activeMatch.entryName}
              </Text>
              <Text fontSize="sm" color="fg.muted">
                {activeMatch.ownerName}
                {activeMatch.ownerBarcode ? ` · ${activeMatch.ownerBarcode}` : ''}
                {` · ${activeMatch.roosterCount} rooster(s)`}
              </Text>
              <Badge mt={2} colorPalette={paymentStatusColor(activeMatch.paymentStatus)}>
                {PAYMENT_STATUS_LABELS[activeMatch.paymentStatus]}
              </Badge>
            </Box>

            {activeMatch.dues.lines.length === 0 ? (
              <Text color="fg.muted" fontSize="sm">
                No fee categories configured for this entry.
              </Text>
            ) : (
              <Stack gap={2}>
                {activeMatch.dues.lines.map((line) => (
                  <Flex
                    key={line.category}
                    justify="space-between"
                    gap={3}
                    fontSize="sm"
                    wrap="wrap"
                  >
                    <Text>{line.label}</Text>
                    <Text color={line.outstanding > 0 ? 'fg' : 'fg.muted'}>
                      {formatCurrency(line.outstanding)} outstanding
                      <Text as="span" color="fg.muted">
                        {' '}
                        (of {formatCurrency(line.amountDue)})
                      </Text>
                    </Text>
                  </Flex>
                ))}
                <Flex justify="space-between" fontWeight="semibold" pt={2}>
                  <Text>Total outstanding</Text>
                  <Text data-testid="cashier-total-outstanding">
                    {formatCurrency(activeMatch.dues.totalOutstanding)}
                  </Text>
                </Flex>
              </Stack>
            )}

            {activeMatch.dues.totalOutstanding > 0 ? (
              <form action={recordAction}>
                <Stack gap={LAYOUT_GAP.form} maxW="xl">
                  <input type="hidden" name="eventId" value={eventId} />
                  <input type="hidden" name="entryId" value={activeMatch.entryId} />

                  <FormField label="Payment category" required>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        name="paymentCategory"
                        value={paymentCategory}
                        onChange={(event) =>
                          setPaymentCategory(event.currentTarget.value as PaymentCategory)
                        }
                      >
                        {activeMatch.dues.lines
                          .filter((line) => line.outstanding > 0)
                          .map((line) => (
                            <option key={line.category} value={line.category}>
                              {line.label}
                            </option>
                          ))}
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
                        key={`${activeMatch.entryId}-${paymentCategory}-${suggestedAmount}`}
                        defaultValue={suggestedAmount || undefined}
                        data-testid="cashier-amount-paid"
                      />
                    </FormField>
                    <FormField label="Payment method" flex="1">
                      <NativeSelect.Root>
                        <NativeSelect.Field
                          name="paymentMethod"
                          value={paymentMethod}
                          onChange={(event) =>
                            setPaymentMethod(
                              event.currentTarget.value as keyof typeof PAYMENT_METHOD_LABELS
                            )
                          }
                        >
                          {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                            <option key={value} value={value} disabled={value !== 'cash'}>
                              {label}
                            </option>
                          ))}
                        </NativeSelect.Field>
                      </NativeSelect.Root>
                    </FormField>
                  </Flex>

                  <FormField label="Notes">
                    <Textarea name="notes" rows={2} maxLength={2000} />
                  </FormField>

                  {recordState.error ? (
                    <Text fontSize="sm" color="red.500">
                      {recordState.error}
                    </Text>
                  ) : null}

                  <Button
                    type="submit"
                    loading={recordPending}
                    alignSelf="flex-start"
                    data-testid="cashier-record-payment"
                  >
                    Collect payment
                  </Button>
                </Stack>
              </form>
            ) : (
              <Text fontSize="sm" color="green.600">
                This entry is fully paid.
              </Text>
            )}
          </Stack>
        </PanelCard>
      ) : null}

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

      <OwnerBarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={(barcode) => {
          setScanValue(barcode)
          void resolveQuery(barcode)
        }}
        title="Scan barcode"
        hint="Point the camera at an OWNER or COCK entry slip barcode."
      />
    </PageStack>
  )
}

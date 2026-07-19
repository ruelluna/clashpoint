'use client'

import {
  Badge,
  Box,
  Flex,
  Link,
  NativeSelect,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useMemo } from 'react'

import { LAYOUT_GAP, PageHeader, PageStack, PanelCard } from '@/components/dashboard'
import type { EventListItem } from '@/features/events/types'
import { globalTransactionKindLabel } from '@/features/transactions/display-utils'
import type { GlobalTransactionKind, GlobalTransactionRow } from '@/features/transactions/types'
import { formatEventDateTime } from '@/lib/format/datetime'

type GlobalTransactionsClientProps = {
  events: EventListItem[]
  selectedEventId: string | null
  selectedEventName: string | null
  revolvingFundBalance: number
  transactions: GlobalTransactionRow[]
  selectedKind: GlobalTransactionKind | 'all'
}

function formatCurrency(amount: number | null) {
  if (amount == null) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

const KIND_OPTIONS: Array<{ value: GlobalTransactionKind | 'all'; label: string }> = [
  { value: 'all', label: 'All types' },
  { value: 'payment', label: 'Payments' },
  { value: 'refund', label: 'Refunds' },
  { value: 'admin_handover', label: 'Admin handovers' },
  { value: 'session_opened', label: 'Sessions opened' },
  { value: 'session_closed', label: 'Sessions closed' },
]

export function GlobalTransactionsClient({
  events,
  selectedEventId,
  selectedEventName,
  revolvingFundBalance,
  transactions,
  selectedKind,
}: GlobalTransactionsClientProps) {
  const eventOptions = useMemo(
    () => events.map((event) => ({ id: event.id, name: event.name })),
    [events]
  )

  return (
    <PageStack>
      <PageHeader
        title="Global transactions"
        description="Read-only ledger for the active event. Filter by event to review history."
        actions={
          selectedEventName ? (
            <Stack gap={1} align={{ base: 'flex-start', sm: 'flex-end' }}>
              <Text fontSize="sm" color="fg.muted">
                Revolving fund · {selectedEventName}
              </Text>
              <Text fontSize="xl" fontWeight="semibold" data-testid="global-revolving-fund">
                {formatCurrency(revolvingFundBalance)}
              </Text>
            </Stack>
          ) : null
        }
      />

      <PanelCard title="Filters">
        <Flex gap={LAYOUT_GAP.form} direction={{ base: 'column', md: 'row' }} wrap="wrap">
          <Box minW={{ md: '280px' }}>
            <Text fontSize="sm" mb={2}>
              Event
            </Text>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={selectedEventId ?? ''}
                onChange={(event) => {
                  const value = event.currentTarget.value
                  const params = new URLSearchParams(window.location.search)
                  if (value) params.set('eventId', value)
                  else params.delete('eventId')
                  params.delete('kind')
                  window.location.href = `/dashboard/transactions?${params.toString()}`
                }}
                data-testid="global-transactions-event-filter"
              >
                <option value="">Select event</option>
                {eventOptions.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>

          <Box minW={{ md: '220px' }}>
            <Text fontSize="sm" mb={2}>
              Type
            </Text>
            <NativeSelect.Root>
              <NativeSelect.Field
                value={selectedKind}
                onChange={(event) => {
                  const value = event.currentTarget.value
                  const params = new URLSearchParams(window.location.search)
                  if (selectedEventId) params.set('eventId', selectedEventId)
                  if (value === 'all') params.delete('kind')
                  else params.set('kind', value)
                  window.location.href = `/dashboard/transactions?${params.toString()}`
                }}
                data-testid="global-transactions-kind-filter"
              >
                {KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>
        </Flex>
      </PanelCard>

      <PanelCard flush title="Transactions">
        {!selectedEventId ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">Select an event to view transactions.</Text>
          </Box>
        ) : transactions.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">No transactions for this event.</Text>
          </Box>
        ) : (
          transactions.map((row) => (
            <Box
              key={row.id}
              px={4}
              py={4}
              borderBottomWidth="1px"
              borderColor="border"
            >
              <Flex direction={{ base: 'column', lg: 'row' }} gap={3} align={{ lg: 'center' }}>
                <Box flex="1">
                  <Flex gap={2} align="center" wrap="wrap">
                    <Badge>{globalTransactionKindLabel(row.kind)}</Badge>
                    <Text fontWeight="medium" fontSize="sm">
                      {row.reference}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" mt={1}>
                    {row.description}
                  </Text>
                  {row.cashierName ? (
                    <Text fontSize="xs" color="fg.muted" mt={1}>
                      Cashier: {row.cashierName}
                    </Text>
                  ) : null}
                </Box>
                <Box flex="0.8">
                  <Text fontSize="sm">{formatCurrency(row.amount)}</Text>
                </Box>
                <Box flex="1">
                  <Text fontSize="sm">{formatEventDateTime(row.occurredAt)}</Text>
                  {row.paymentId ? (
                    <Link
                      href={`/dashboard/events/${row.eventId}/payments/${row.paymentId}/print`}
                      fontSize="xs"
                      color="blue.600"
                    >
                      Reprint receipt
                    </Link>
                  ) : null}
                </Box>
              </Flex>
            </Box>
          ))
        )}
      </PanelCard>
    </PageStack>
  )
}

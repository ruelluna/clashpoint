'use client'

import { Badge, Box, Button, Flex, Input, NativeSelect, Text, Textarea } from '@chakra-ui/react'
import Link from 'next/link'
import { useActionState, useMemo, useState } from 'react'

import {
  approveEntryAction,
  rejectEntryAction,
  type EntryActionState,
} from '@/features/entries/actions'
import {
  canSubmitLineup,
  ENTRY_SOURCE_LABELS,
  PAYMENT_STATUS_LABELS,
  REGISTRATION_STATUS_LABELS,
} from '@/features/entries/schema'
import type { EntryListItem } from '@/features/entries/types'

type EntriesListClientProps = {
  eventId: string
  eventName: string
  entries: EntryListItem[]
}

const initialState: EntryActionState = {}

function registrationColor(
  status: EntryListItem['registration_status']
): 'gray' | 'yellow' | 'green' | 'red' | 'blue' | 'orange' {
  switch (status) {
    case 'submitted':
      return 'gray'
    case 'pending_review':
      return 'yellow'
    case 'approved':
      return 'blue'
    case 'confirmed':
      return 'green'
    case 'rejected':
      return 'red'
    case 'cancelled':
      return 'orange'
    default:
      return 'gray'
  }
}

function paymentColor(
  status: EntryListItem['payment_status']
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

function EntryActions({
  entry,
  eventId,
}: {
  entry: EntryListItem
  eventId: string
}) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveEntryAction,
    initialState
  )
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectEntryAction,
    initialState
  )
  const [showRejectReason, setShowRejectReason] = useState(false)

  const canReview =
    entry.registration_status === 'submitted' ||
    entry.registration_status === 'pending_review' ||
    entry.registration_status === 'approved'

  if (!canReview) return null

  return (
    <Box mt={2}>
      <Flex gap={2} wrap="wrap">
        <form action={approveAction}>
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="eventId" value={eventId} />
          <Button size="xs" type="submit" loading={approvePending}>
            Approve
          </Button>
        </form>
        <Button
          size="xs"
          variant="outline"
          onClick={() => setShowRejectReason((current) => !current)}
        >
          Reject
        </Button>
      </Flex>

      {showRejectReason ? (
        <form action={rejectAction} className="mt-2">
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="eventId" value={eventId} />
          <Textarea
            name="reason"
            placeholder="Reason for rejection"
            rows={2}
            size="sm"
            required
            minLength={3}
          />
          <Button size="xs" type="submit" mt={2} colorPalette="red" loading={rejectPending}>
            Confirm reject
          </Button>
        </form>
      ) : null}

      {approveState.error ? (
        <Text fontSize="xs" color="red.500" mt={1}>
          {approveState.error}
        </Text>
      ) : null}
      {rejectState.error ? (
        <Text fontSize="xs" color="red.500" mt={1}>
          {rejectState.error}
        </Text>
      ) : null}
      {approveState.success || rejectState.success ? (
        <Text fontSize="xs" color="green.600" mt={1}>
          {approveState.success ?? rejectState.success}
        </Text>
      ) : null}
    </Box>
  )
}

export function EntriesListClient({
  eventId,
  eventName,
  entries,
}: EntriesListClientProps) {
  const [statusFilter, setStatusFilter] = useState<
    '' | EntryListItem['registration_status']
  >('')

  const filteredEntries = useMemo(() => {
    if (!statusFilter) return entries
    return entries.filter((entry) => entry.registration_status === statusFilter)
  }, [entries, statusFilter])

  return (
    <Box className="space-y-6">
      <Flex
        justify="space-between"
        align={{ base: 'stretch', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        gap={3}
      >
        <Box>
          <Text fontSize="lg" fontWeight="semibold">
            Registrations
          </Text>
          <Text color="fg.muted" fontSize="sm">
            {eventName} · {entries.length} entr{entries.length === 1 ? 'y' : 'ies'}
          </Text>
        </Box>
        <Button asChild alignSelf={{ base: 'flex-start', sm: 'auto' }}>
          <Link href={`/dashboard/events/${eventId}/registrations/new`}>
            New registration
          </Link>
        </Button>
      </Flex>

      <Flex align="center" gap={3} maxW="xs">
        <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
          Filter by status
        </Text>
        <NativeSelect.Root size="sm">
          <NativeSelect.Field
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.currentTarget.value as '' | EntryListItem['registration_status']
              )
            }
          >
            <option value="">All statuses</option>
            {Object.entries(REGISTRATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect.Field>
        </NativeSelect.Root>
      </Flex>

      <Box borderWidth="1px" borderColor="border" rounded="lg" overflow="hidden">
        <Flex
          px={4}
          py={3}
          borderBottomWidth="1px"
          borderColor="border"
          fontWeight="medium"
          fontSize="sm"
          display={{ base: 'none', lg: 'flex' }}
        >
          <Box flex="0.6">#</Box>
          <Box flex="1.4">Entry</Box>
          <Box flex="1">Owner</Box>
          <Box flex="1">Registration</Box>
          <Box flex="1">Payment</Box>
          <Box flex="0.8">Lineup</Box>
        </Flex>

        {filteredEntries.length === 0 ? (
          <Box px={4} py={8} textAlign="center">
            <Text color="fg.muted">No registrations yet.</Text>
            <Button asChild mt={4} size="sm">
              <Link href={`/dashboard/events/${eventId}/registrations/new`}>
                Register first entry
              </Link>
            </Button>
          </Box>
        ) : (
          filteredEntries.map((entry) => {
            const lineupEligible = canSubmitLineup({
              registration_status: entry.registration_status,
              payment_status: entry.payment_status,
            })

            return (
              <Box
                key={entry.id}
                px={4}
                py={3}
                borderBottomWidth="1px"
                borderColor="border"
              >
                <Flex
                  direction={{ base: 'column', lg: 'row' }}
                  gap={2}
                  align={{ lg: 'center' }}
                >
                  <Box flex="0.6">
                    <Text fontWeight="semibold">{entry.entry_number}</Text>
                  </Box>
                  <Box flex="1.4">
                    <Text fontWeight="medium">{entry.entry_name}</Text>
                    <Text fontSize="sm" color="fg.muted">
                      {ENTRY_SOURCE_LABELS[entry.entry_source]}
                      {entry.promoter_name ? ` · ${entry.promoter_name}` : ''}
                    </Text>
                  </Box>
                  <Box flex="1">
                    <Text fontSize="sm">{entry.owner_name}</Text>
                    {entry.handler_name ? (
                      <Text fontSize="xs" color="fg.muted">
                        Handler: {entry.handler_name}
                      </Text>
                    ) : null}
                  </Box>
                  <Box flex="1">
                    <Badge colorPalette={registrationColor(entry.registration_status)}>
                      {REGISTRATION_STATUS_LABELS[entry.registration_status]}
                    </Badge>
                  </Box>
                  <Box flex="1">
                    <Badge colorPalette={paymentColor(entry.payment_status)}>
                      {PAYMENT_STATUS_LABELS[entry.payment_status]}
                    </Badge>
                  </Box>
                  <Box flex="0.8">
                    <Badge colorPalette={lineupEligible ? 'green' : 'gray'}>
                      {lineupEligible ? 'Eligible' : 'Not eligible'}
                    </Badge>
                  </Box>
                </Flex>
                <EntryActions entry={entry} eventId={eventId} />
              </Box>
            )
          })
        )}
      </Box>
    </Box>
  )
}

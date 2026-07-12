'use client'

import { Badge, Box, Button, Flex, NativeSelect, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import {
  canSubmitLineup,
  ENTRY_SOURCE_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/features/entries/schema'
import type { EntryListItem } from '@/features/entries/types'

type EntriesListClientProps = {
  eventId: string
  eventName: string
  entries: EntryListItem[]
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

export function EntriesListClient({
  eventId,
  eventName,
  entries,
}: EntriesListClientProps) {
  const [paymentFilter, setPaymentFilter] = useState<
    '' | EntryListItem['payment_status']
  >('')

  const filteredEntries = useMemo(() => {
    if (!paymentFilter) return entries
    return entries.filter((entry) => entry.payment_status === paymentFilter)
  }, [entries, paymentFilter])

  return (
    <Flex direction="column" gap={8}>
      <Flex direction="column" gap={5}>
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
            <Text color="fg.muted" fontSize="sm" mt={1}>
              Event roster — payment unlocks lineup submission; matching happens later.
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
            Filter by payment
          </Text>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(
                  event.currentTarget.value as '' | EntryListItem['payment_status']
                )
              }
            >
              <option value="">All payments</option>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Flex>
      </Flex>

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
          <Box flex="0.6">#</Box>
          <Box flex="1.4">Entry</Box>
          <Box flex="1">Owner</Box>
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
              payment_status: entry.payment_status,
            })

            return (
              <Box
                key={entry.id}
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
              </Box>
            )
          })
        )}
      </Box>
    </Flex>
  )
}

'use client'

import { Badge, Box, Button, Flex, Input, Stack, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { LAYOUT_GAP } from '@/components/dashboard'
import { OwnerBarcodeScanRow } from '@/features/entries/components/owner-barcode-scan-row'
import type { EntryListItem } from '@/features/entries/types'
import type { EventFeeSettings } from '@/features/events/fee-utils'
import type { EntryFeeSnapshot } from '@/features/events/fee-utils'
import { getOwnerRegistrationPaymentDisplay } from '@/features/payments/display-utils'

type OwnersListClientProps = {
  eventId: string
  eventType: string
  entries: EntryListItem[]
  eventFeeSettings: EventFeeSettings
}

function OwnerListCard({
  eventId,
  entry,
  paymentDisplay,
}: {
  eventId: string
  entry: EntryListItem
  paymentDisplay: ReturnType<typeof getOwnerRegistrationPaymentDisplay>
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border"
      rounded="md"
      p={4}
      data-entry-id={entry.id}
    >
      <Flex
        justify="space-between"
        align={{ base: 'stretch', md: 'start' }}
        gap={4}
        direction={{ base: 'column', md: 'row' }}
      >
        <Stack gap={1} flex="1" minW={0}>
          <Text fontWeight="semibold">
            #{entry.entry_number} {entry.owner_name}
          </Text>
          {entry.contact_full_name ? (
            <Text fontSize="sm" color="fg.muted">
              Contact: {entry.contact_full_name}
              {entry.contact_designation ? ` · ${entry.contact_designation}` : ''}
            </Text>
          ) : null}
          {entry.contact_number ? (
            <Text fontSize="sm" color="fg.muted">
              {entry.contact_number}
            </Text>
          ) : null}
          {entry.owner_barcode ? (
            <Text fontSize="xs" color="fg.muted" fontFamily="mono">
              {entry.owner_barcode}
            </Text>
          ) : null}
          <Flex gap={2} wrap="wrap">
            <Badge size="sm">{entry.rooster_count} cock(s)</Badge>
            {paymentDisplay ? (
              <Badge size="sm" colorPalette={paymentDisplay.colorPalette}>
                {paymentDisplay.label}
              </Badge>
            ) : null}
          </Flex>
        </Stack>

        <Button
          asChild
          size="md"
          variant="outline"
          alignSelf={{ base: 'stretch', md: 'flex-start' }}
          data-testid="owners-view-details-button"
        >
          <Link href={`/dashboard/events/${eventId}/owners/${entry.id}`}>
            View owner details
          </Link>
        </Button>
      </Flex>
    </Box>
  )
}

export function OwnersListClient({
  eventId,
  eventType,
  entries,
  eventFeeSettings,
}: OwnersListClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const isDerby = eventType === 'derby'

  const filteredEntries = useMemo(() => {
    const trimmed = search.trim().toLowerCase()
    if (!trimmed) return entries

    return entries.filter((entry) => {
      const haystack = [
        entry.entry_number,
        entry.owner_name,
        entry.contact_full_name,
        entry.contact_designation,
        entry.contact_number,
        entry.email,
        entry.owner_barcode,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(trimmed)
    })
  }, [entries, search])

  if (entries.length === 0) {
    return <Text color="fg.muted">No owners registered yet.</Text>
  }

  return (
    <Stack gap={LAYOUT_GAP.section}>
      <Flex align="center" gap={3} maxW="md">
        <Text fontSize="sm" fontWeight="medium" whiteSpace="nowrap">
          Search
        </Text>
        <Input
          size="sm"
          placeholder="Filter by owner, contact, entry #, or barcode"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </Flex>

      {isDerby ? (
        <OwnerBarcodeScanRow
          eventId={eventId}
          maxW="md"
          onResolved={(entryId) => {
            router.push(`/dashboard/events/${eventId}/owners/${entryId}`)
          }}
        />
      ) : null}

      {filteredEntries.length === 0 ? (
        <Text color="fg.muted">No owners match this search.</Text>
      ) : (
        <Stack gap={4}>
          {filteredEntries.map((entry) => {
            const feeSettings =
              entry.fee_snapshot != null
                ? (entry.fee_snapshot as unknown as EntryFeeSnapshot)
                : eventFeeSettings
            const paymentDisplay = getOwnerRegistrationPaymentDisplay(
              entry.payment_status,
              feeSettings
            )

            return (
              <OwnerListCard
                key={entry.id}
                eventId={eventId}
                entry={entry}
                paymentDisplay={paymentDisplay}
              />
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}

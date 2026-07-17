'use client'

import { Badge, Button, Flex, Input, Text } from '@chakra-ui/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { ButtonGroup } from '@/components/dashboard'
import { OwnerBarcodeScanRow } from '@/features/entries/components/owner-barcode-scan-row'
import type { EntryListItem } from '@/features/entries/types'
import type { EventFeeSettings } from '@/features/events/fee-utils'
import type { EntryFeeSnapshot } from '@/features/events/fee-utils'
import { getOwnerRegistrationPaymentDisplay } from '@/features/payments/display-utils'

type OwnersListClientProps = {
  eventId: string
  entries: EntryListItem[]
  eventFeeSettings: EventFeeSettings
}

export function OwnersListClient({
  eventId,
  entries,
  eventFeeSettings,
}: OwnersListClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')

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
    <Flex direction="column" gap={4}>
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

      <OwnerBarcodeScanRow
        eventId={eventId}
        maxW="md"
        onResolved={(entryId) => {
          router.push(`/dashboard/events/${eventId}/owners/${entryId}`)
        }}
      />

      {filteredEntries.length === 0 ? (
        <Text color="fg.muted">No owners match this search.</Text>
      ) : (
        <Flex direction="column" gap={3}>
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
              <Flex
                key={entry.id}
                justify="space-between"
                align={{ base: 'flex-start', md: 'center' }}
                direction={{ base: 'column', md: 'row' }}
                gap={2}
                borderWidth="1px"
                borderColor="border"
                rounded="md"
                p={3}
                _hover={{ borderColor: 'border.emphasized', bg: 'bg.subtle' }}
                transition="border-color 0.15s, background 0.15s"
              >
                <Flex direction="column" gap={1} flex="1" minW={0}>
                  <Link href={`/dashboard/events/${eventId}/owners/${entry.id}`}>
                    <Text
                      fontWeight="semibold"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      #{entry.entry_number} {entry.owner_name}
                    </Text>
                  </Link>
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
                    <Badge>{entry.rooster_count} cock(s)</Badge>
                    {paymentDisplay ? (
                      <Badge colorPalette={paymentDisplay.colorPalette}>
                        {paymentDisplay.label}
                      </Badge>
                    ) : null}
                  </Flex>
                </Flex>
                <ButtonGroup>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/events/${eventId}/owners/${entry.id}`}>View</Link>
                  </Button>
                  {entry.owner_barcode ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/events/${eventId}/owners/${entry.id}/print`}>
                        Print OWNER slip
                      </Link>
                    </Button>
                  ) : null}
                </ButtonGroup>
              </Flex>
            )
          })}
        </Flex>
      )}
    </Flex>
  )
}

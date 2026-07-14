'use client'

import { Badge, Button, Flex, Text } from '@chakra-ui/react'
import Link from 'next/link'

import { ButtonGroup } from '@/components/dashboard'
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

export function OwnersListClient({
  eventId,
  eventType,
  entries,
  eventFeeSettings,
}: OwnersListClientProps) {
  if (entries.length === 0) {
    return <Text color="fg.muted">No owners registered yet.</Text>
  }

  return (
    <Flex direction="column" gap={3}>
      {entries.map((entry) => {
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
              {entry.handler_name ? (
                <Text fontSize="sm" color="fg.muted">
                  Handler: {entry.handler_name}
                </Text>
              ) : null}
              <Flex gap={2}>
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
              {eventType === 'derby' ? (
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
  )
}

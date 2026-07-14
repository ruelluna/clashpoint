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
          >
            <Flex direction="column" gap={1}>
              <Text fontWeight="semibold">
                #{entry.entry_number} {entry.owner_name}
              </Text>
              {entry.handler_name ? (
                <Text fontSize="sm" color="fg.muted">
                  Handler: {entry.handler_name}
                </Text>
              ) : null}
              <Flex gap={2}>
                <Badge>{entry.rooster_count} cock(s)</Badge>
                <Badge colorPalette={paymentDisplay.colorPalette}>
                  {paymentDisplay.label}
                </Badge>
              </Flex>
            </Flex>
            <ButtonGroup>
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

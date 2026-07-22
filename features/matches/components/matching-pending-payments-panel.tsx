'use client'

import { Box, Button, Link, Stack, Text } from '@chakra-ui/react'

import { PanelCard } from '@/components/dashboard'
import { MatchingPendingPaymentRow } from '@/features/matches/components/matching-pending-payment-row'
import type { MatchListItem } from '@/features/matches/types'

type MatchingPendingPaymentsPanelProps = {
  eventId: string
  awaitingPaymentMatches: MatchListItem[]
  canManage: boolean
}

export function MatchingPendingPaymentsPanel({
  eventId,
  awaitingPaymentMatches,
  canManage,
}: MatchingPendingPaymentsPanelProps) {
  return (
    <PanelCard flush title="Awaiting cashier payment">
      <Box px={4} pt={4} pb={awaitingPaymentMatches.length === 0 ? 4 : 0}>
        <Stack gap={2} mb={3}>
          <Text fontSize="sm" color="fg.muted">
            Matching staff do not collect payments. Direct each handler to{' '}
            <Text as="span" fontWeight="medium">
              Cashier Terminal
            </Text>{' '}
            with their rooster COCK- barcode or printed BET- pledge slip.
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Matches enter the fight queue automatically after both sides pay pledges and any enabled
            entry fees are cleared.
          </Text>
          <Button
            asChild
            size="md"
            variant="outline"
            alignSelf={{ base: 'stretch', sm: 'flex-start' }}
            w={{ base: 'full', sm: 'auto' }}
          >
            <Link href={`/dashboard/events/${eventId}/payments`}>Open Cashier Terminal</Link>
          </Button>
        </Stack>
        {awaitingPaymentMatches.length === 0 ? (
          <Text color="fg.muted" fontSize="sm">
            No matches awaiting cashier payment.
          </Text>
        ) : null}
      </Box>
      {awaitingPaymentMatches.map((match) => (
        <MatchingPendingPaymentRow
          key={match.id}
          eventId={eventId}
          match={match}
          canManage={canManage}
        />
      ))}
    </PanelCard>
  )
}

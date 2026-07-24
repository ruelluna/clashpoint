'use client'

import { Badge, Box, Button, Flex, Link, Stack, Text } from '@chakra-ui/react'

import { PanelCard } from '@/components/dashboard'
import {
  AdjustPledgeForm,
  CancelMatchForm,
  formatCurrencyDetailed,
  SidePaymentBadges,
} from '@/features/matches/components/matching-shared'
import { MATCH_STATUS_LABELS } from '@/features/matches/schema'
import { matchStatusColorPalette } from '@/features/matches/display-utils'
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
    <PanelCard title="Awaiting cashier payment">
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
        <Button asChild size="sm" variant="outline" alignSelf="flex-start">
          <Link href={`/dashboard/events/${eventId}/payments`}>Open Cashier Terminal</Link>
        </Button>
      </Stack>
      {awaitingPaymentMatches.length === 0 ? (
        <Text color="fg.muted" fontSize="sm">
          No matches awaiting cashier payment.
        </Text>
      ) : (
        awaitingPaymentMatches.map((match) => (
          <Box
            key={match.id}
            py={3}
            borderBottomWidth="1px"
            borderColor="border"
            _last={{ borderBottomWidth: 0 }}
          >
            <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
              <Text fontWeight="semibold" flex="0 0 4rem">
                #{match.fight_number}
              </Text>
              <Box flex="1">
                <Text fontWeight="medium">{match.meron.entry_name}</Text>
                <Text fontSize="sm" color="fg.muted">
                  Cock #{match.meron.cock_number} · Bet{' '}
                  {formatCurrencyDetailed(match.meron.bet_amount)}
                </Text>
                <SidePaymentBadges side={match.meron} />
              </Box>
              <Box flex="1">
                <Text fontWeight="medium">{match.wala.entry_name}</Text>
                <Text fontSize="sm" color="fg.muted">
                  Cock #{match.wala.cock_number} · Bet{' '}
                  {formatCurrencyDetailed(match.wala.bet_amount)}
                </Text>
                <SidePaymentBadges side={match.wala} />
              </Box>
              <Stack gap={2} align={{ base: 'flex-start', md: 'flex-end' }}>
                <Badge colorPalette={matchStatusColorPalette(match.status)} size="sm">
                  {MATCH_STATUS_LABELS[match.status]}
                </Badge>
                {canManage && match.meron.bet_barcode ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/events/${eventId}/matching/${match.id}/print`}>
                      Print slips
                    </Link>
                  </Button>
                ) : null}
                {canManage ? (
                  <CancelMatchForm eventId={eventId} matchId={match.id} canManage={canManage} />
                ) : null}
                <AdjustPledgeForm eventId={eventId} match={match} canManage={canManage} />
              </Stack>
            </Flex>
          </Box>
        ))
      )}
    </PanelCard>
  )
}

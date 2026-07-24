'use client'

import { Badge, Box, Button, Flex, Link, Stack, Text } from '@chakra-ui/react'

import { MatchingMatchSideBlock } from '@/features/matches/components/matching-match-side-block'
import {
  AdjustPledgeForm,
  CancelMatchForm,
} from '@/features/matches/components/matching-shared'
import { MATCH_STATUS_LABELS } from '@/features/matches/schema'
import { matchStatusColorPalette } from '@/features/matches/display-utils'
import type { MatchListItem } from '@/features/matches/types'

type MatchingPendingPaymentRowProps = {
  eventId: string
  match: MatchListItem
  canManage: boolean
}

export function MatchingPendingPaymentRow({
  eventId,
  match,
  canManage,
}: MatchingPendingPaymentRowProps) {
  return (
    <Box
      px={4}
      py={{ base: 3, lg: 4 }}
      borderBottomWidth="1px"
      borderColor="border"
      data-testid="matching-pending-payment-row"
    >
      <Box display={{ base: 'block', lg: 'none' }}>
        <Box borderWidth="1px" borderColor="border" borderRadius="md" p={4}>
          <Flex justify="space-between" align="flex-start" gap={3} mb={4}>
            <Text fontSize="lg" fontWeight="semibold">
              Fight #{match.fight_number}
            </Text>
            <Badge flexShrink={0} colorPalette={matchStatusColorPalette(match.status)} size="sm">
              {MATCH_STATUS_LABELS[match.status]}
            </Badge>
          </Flex>

          <Stack gap={4}>
            <MatchingMatchSideBlock side="meron" details={match.meron} emphasizeBet />
            <MatchingMatchSideBlock side="wala" details={match.wala} emphasizeBet />
          </Stack>

          <Stack gap={2} mt={4}>
            {canManage && match.meron.bet_barcode ? (
              <Button asChild size="md" variant="outline" w="full">
                <Link href={`/dashboard/events/${eventId}/matching/${match.id}/print`}>
                  Print slips
                </Link>
              </Button>
            ) : null}
            {canManage ? (
              <Box w="full">
                <CancelMatchForm
                  eventId={eventId}
                  matchId={match.id}
                  canManage={canManage}
                  buttonSize="md"
                  fullWidth
                />
              </Box>
            ) : null}
          </Stack>
          <AdjustPledgeForm eventId={eventId} match={match} canManage={canManage} />
        </Box>
      </Box>

      <Flex display={{ base: 'none', lg: 'flex' }} gap={4} align="center">
        <Text fontWeight="semibold" flex="0 0 4rem">
          #{match.fight_number}
        </Text>
        <Box flex="1">
          <MatchingMatchSideBlock side="meron" details={match.meron} />
        </Box>
        <Box flex="1">
          <MatchingMatchSideBlock side="wala" details={match.wala} />
        </Box>
        <Stack gap={2} align="flex-end">
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
  )
}
